package com.forlove.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "forlove.couple")
public class CoupleProperties {

    private String username1;
    private String username2;
    private String nickname1;
    private String nickname2;
    private String startDate;
    private List<MeetPlace> meetPlaces = new ArrayList<>();
    private List<String> loveQuotes = new ArrayList<>();
    private List<Anniversary> anniversaries = new ArrayList<>();

    public String getUsername1() { return username1; }
    public void setUsername1(String username1) { this.username1 = username1; }
    public String getUsername2() { return username2; }
    public void setUsername2(String username2) { this.username2 = username2; }
    public String getNickname1() { return nickname1; }
    public void setNickname1(String nickname1) { this.nickname1 = nickname1; }
    public String getNickname2() { return nickname2; }
    public void setNickname2(String nickname2) { this.nickname2 = nickname2; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public List<MeetPlace> getMeetPlaces() { return meetPlaces; }
    public void setMeetPlaces(List<MeetPlace> meetPlaces) { this.meetPlaces = meetPlaces; }
    public List<String> getLoveQuotes() { return loveQuotes; }
    public void setLoveQuotes(List<String> loveQuotes) { this.loveQuotes = loveQuotes; }
    public List<Anniversary> getAnniversaries() { return anniversaries; }
    public void setAnniversaries(List<Anniversary> anniversaries) { this.anniversaries = anniversaries; }

    public String getPartnerUsername(String username) {
        if (username != null && username.equals(username1)) return username2;
        if (username != null && username.equals(username2)) return username1;
        return null;
    }

    public String getNickname(String username) {
        if (username != null && username.equals(username1)) return nickname1;
        if (username != null && username.equals(username2)) return nickname2;
        return username;
    }

    /** 优先取 anniversaries 里「在一起」的日期，否则回退 start-date */
    public String getTogetherDate() {
        return anniversaries.stream()
            .filter(a -> "在一起".equals(a.getName()))
            .map(Anniversary::getDate)
            .findFirst()
            .orElse(startDate);
    }

    public long getDaysTogether() {
        String date = getTogetherDate();
        if (date == null || date.isBlank()) {
            return 0;
        }
        return ChronoUnit.DAYS.between(LocalDate.parse(date), LocalDate.now()) + 1;
    }

    public static class MeetPlace {
        private String name;
        private double lat;
        private double lng;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public double getLat() { return lat; }
        public void setLat(double lat) { this.lat = lat; }
        public double getLng() { return lng; }
        public void setLng(double lng) { this.lng = lng; }
    }

    public static class Anniversary {
        private String name;
        private String date;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
    }
}
