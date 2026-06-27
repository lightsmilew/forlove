package com.forlove.controller;

import com.forlove.config.CoupleProperties;
import com.forlove.dto.LocationRequest;
import com.forlove.entity.LocationRecord;
import com.forlove.repository.LocationRecordRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/distance")
public class DistanceController {

    private final LocationRecordRepository locationRepository;
    private final CoupleProperties coupleProperties;

    public DistanceController(LocationRecordRepository locationRepository,
                              CoupleProperties coupleProperties) {
        this.locationRepository = locationRepository;
        this.coupleProperties = coupleProperties;
    }

    @PostMapping("/location")
    public LocationRecord recordLocation(@RequestBody LocationRequest request, Authentication auth) {
        LocationRecord record = new LocationRecord();
        record.setUsername(auth.getName());
        record.setLat(request.lat());
        record.setLng(request.lng());
        record.setPlaceName(request.placeName());
        return locationRepository.save(record);
    }

    @GetMapping("/locations")
    public List<LocationRecord> allLocations() {
        return locationRepository.findAllByOrderByRecordedAtDesc();
    }

    @GetMapping("/between")
    public Map<String, Object> distanceBetween() {
        List<LocationRecord> all = locationRepository.findAllByOrderByRecordedAtDesc();
        Map<String, LocationRecord> latest = new HashMap<>();
        for (LocationRecord r : all) {
            latest.putIfAbsent(r.getUsername(), r);
        }

        LocationRecord loc1 = latest.values().stream().findFirst().orElse(null);
        LocationRecord loc2 = latest.values().stream().skip(1).findFirst().orElse(null);

        double distance = 0;
        if (loc1 != null && loc2 != null && loc1.getLat() != null && loc2.getLat() != null) {
            distance = haversine(loc1.getLat(), loc1.getLng(), loc2.getLat(), loc2.getLng());
        }

        List<Map<String, Object>> meetPlaces = coupleProperties.getMeetPlaces().stream()
            .map(p -> {
                Map<String, Object> m = new HashMap<>();
                m.put("name", p.getName());
                m.put("lat", p.getLat());
                m.put("lng", p.getLng());
                return m;
            })
            .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("distanceKm", Math.round(distance * 10) / 10.0);
        result.put("meetPlaces", meetPlaces);
        result.put("locations", latest.values());
        return result;
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
