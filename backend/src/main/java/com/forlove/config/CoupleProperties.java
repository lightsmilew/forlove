package com.forlove.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "forlove.couple")
public class CoupleProperties {

    private List<MeetPlace> meetPlaces = new ArrayList<>();

    public List<MeetPlace> getMeetPlaces() {
        return meetPlaces;
    }

    public void setMeetPlaces(List<MeetPlace> meetPlaces) {
        this.meetPlaces = meetPlaces;
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
}
