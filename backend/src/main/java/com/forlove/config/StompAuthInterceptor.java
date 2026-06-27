package com.forlove.config;

import com.forlove.service.PresenceService;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class StompAuthInterceptor implements ChannelInterceptor {

    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;
    private final CoupleProperties coupleProperties;

    public StompAuthInterceptor(
            PresenceService presenceService,
            @Lazy SimpMessagingTemplate messagingTemplate,
            CoupleProperties coupleProperties) {
        this.presenceService = presenceService;
        this.messagingTemplate = messagingTemplate;
        this.coupleProperties = coupleProperties;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
            if (sessionAttributes != null) {
                String username = (String) sessionAttributes.get("username");
                if (username != null) {
                    accessor.setUser(new StompPrincipal(username));
                    presenceService.markConnected(username);
                    broadcastPresence();
                }
            }
        } else if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
            String username = resolveUsername(accessor);
            if (username != null) {
                presenceService.markDisconnected(username);
                broadcastPresence();
            }
        }

        return message;
    }

    private String resolveUsername(StompHeaderAccessor accessor) {
        Principal user = accessor.getUser();
        if (user != null) {
            return user.getName();
        }
        Map<String, Object> attrs = accessor.getSessionAttributes();
        if (attrs != null) {
            return (String) attrs.get("username");
        }
        return null;
    }

    private void broadcastPresence() {
        List<Map<String, Object>> users = List.of(
            presenceService.statusFor(coupleProperties.getUsername1(), coupleProperties.getNickname1()),
            presenceService.statusFor(coupleProperties.getUsername2(), coupleProperties.getNickname2())
        );
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("users", users);
        messagingTemplate.convertAndSend("/topic/presence", payload);
    }

    public static class StompPrincipal implements Principal {
        private final String name;

        public StompPrincipal(String name) {
            this.name = name;
        }

        @Override
        public String getName() {
            return name;
        }
    }
}
