package io.github.luinara.sqs.weather;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.luinara.sqs.weather.dto.WeatherLocationDto;
import io.github.luinara.sqs.weather.dto.WeatherSnapshotDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Stream;

@Service
public class WeatherService {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(2);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(4);
    private static final Set<String> POPULATED_PLACE_FEATURE_CODES = Set.of(
            "PPL",
            "PPLA",
            "PPLA2",
            "PPLA3",
            "PPLA4",
            "PPLC",
            "PPLX"
    );

    private final String forecastBaseUrl;
    private final String geocodingBaseUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Autowired
    public WeatherService(
            @Value("${weather.forecast-base-url:https://api.open-meteo.com/v1/forecast}") String forecastBaseUrl,
            @Value("${weather.geocoding-base-url:https://geocoding-api.open-meteo.com/v1/search}")
                    String geocodingBaseUrl
    ) {
        this(
                forecastBaseUrl,
                geocodingBaseUrl,
                HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build(),
                new ObjectMapper()
        );
    }

    WeatherService(
            String forecastBaseUrl,
            String geocodingBaseUrl,
            HttpClient httpClient,
            ObjectMapper objectMapper
    ) {
        this.forecastBaseUrl = trimTrailingSlash(forecastBaseUrl);
        this.geocodingBaseUrl = trimTrailingSlash(geocodingBaseUrl);
        this.httpClient = httpClient;
        this.objectMapper = objectMapper.copy()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public WeatherLocationDto resolveCity(String cityName) {
        String normalizedCityName = cityName == null ? "" : cityName.trim();

        if (normalizedCityName.isBlank()) {
            throw new WeatherApiException("Bitte gib eine Stadt ein.");
        }

        GeocodingResponse response = fetchJson(createGeocodingUri(normalizedCityName), GeocodingResponse.class);
        GeocodingResult result = selectBestGeocodingResult(response.results(), normalizedCityName);

        if (result == null) {
            throw new WeatherApiException("Stadt nicht gefunden.");
        }

        return new WeatherLocationDto(result.latitude(), result.longitude(), createLocationLabel(result));
    }

    public WeatherSnapshotDto loadWeather(double latitude, double longitude, String locationLabel) {
        WeatherApiResponse response = fetchJson(createForecastUri(latitude, longitude), WeatherApiResponse.class);
        WeatherApiCurrent current = response.current() == null
                ? new WeatherApiCurrent(null, null, null)
                : response.current();
        int weatherCode = current.weatherCode() == null ? 3 : current.weatherCode();
        WeatherCondition condition = mapWeatherCodeToCondition(weatherCode);
        String timeOfDay = Integer.valueOf(0).equals(current.isDay()) ? "night" : "day";

        return new WeatherSnapshotDto(
                condition.value(),
                timeOfDay,
                current.temperatureC() == null ? 0 : current.temperatureC(),
                weatherCode,
                condition.label(),
                locationLabel,
                Instant.now().toString()
        );
    }

    private URI createGeocodingUri(String cityName) {
        String encodedCityName = URLEncoder.encode(cityName, StandardCharsets.UTF_8);
        return URI.create(geocodingBaseUrl + "?name=" + encodedCityName + "&count=10&language=de&format=json");
    }

    private URI createForecastUri(double latitude, double longitude) {
        return URI.create(
                forecastBaseUrl
                        + "?latitude=" + latitude
                        + "&longitude=" + longitude
                        + "&current=temperature_2m,weather_code,is_day"
                        + "&elevation=nan&timezone=auto"
        );
    }

    private <T> T fetchJson(URI uri, Class<T> responseType) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(uri)
                    .version(HttpClient.Version.HTTP_1_1)
                    .timeout(REQUEST_TIMEOUT)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new WeatherApiException("Open-Meteo antwortete mit Status " + response.statusCode() + ".");
            }

            return objectMapper.readValue(response.body(), responseType);
        } catch (IOException | IllegalArgumentException ex) {
            throw new WeatherApiException("Wetterdaten sind gerade nicht verfuegbar.", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new WeatherApiException("Wetterdaten sind gerade nicht verfuegbar.", ex);
        }
    }

    private static GeocodingResult selectBestGeocodingResult(List<GeocodingResult> results, String searchTerm) {
        if (results == null || results.isEmpty()) {
            return null;
        }

        String normalizedSearchTerm = normalizeGeocodingText(searchTerm);
        String compactSearchTerm = compactGeocodingText(normalizedSearchTerm);

        return results.stream()
                .max(Comparator.comparingDouble(result ->
                        scoreGeocodingResult(result, normalizedSearchTerm, compactSearchTerm, results.indexOf(result))))
                .orElse(null);
    }

    private static double scoreGeocodingResult(
            GeocodingResult result,
            String normalizedSearchTerm,
            String compactSearchTerm,
            int index
    ) {
        String featureCode = result.featureCode() == null ? "" : result.featureCode().toUpperCase(Locale.ROOT);
        boolean isPopulatedPlace = POPULATED_PLACE_FEATURE_CODES.contains(featureCode);
        String normalizedName = normalizeGeocodingText(result.name());
        String normalizedAdmin1 = normalizeGeocodingText(result.admin1());
        String compactName = compactGeocodingText(normalizedName);
        double score = isPopulatedPlace ? 1000 : -500;

        if ("PPLC".equals(featureCode)) {
            score += 900;
        } else if (featureCode.startsWith("PPLA")) {
            score += 300;
        }

        if (normalizedName.equals(normalizedSearchTerm)) {
            score += isPopulatedPlace ? 700 : 80;
        } else if (compactName.startsWith(compactSearchTerm)) {
            score += 180;
        } else if (compactName.contains(compactSearchTerm)) {
            score += 90;
        }

        if (normalizedAdmin1.equals(normalizedSearchTerm)) {
            score += 650;
        }

        if (result.elevation() != null) {
            score += Math.max(0.0, 1000.0 - result.elevation()) / 10.0;
        }

        if (result.population() != null) {
            double population = result.population().doubleValue();
            score += Math.min(population, 10_000_000.0) / 10_000.0;
        }

        return score - index;
    }

    private static WeatherCondition mapWeatherCodeToCondition(int weatherCode) {
        if (weatherCode == 0) {
            return WeatherCondition.CLEAR;
        }

        if (weatherCode >= 1 && weatherCode <= 3) {
            return WeatherCondition.CLOUDY;
        }

        if (weatherCode == 45 || weatherCode == 48) {
            return WeatherCondition.FOG;
        }

        if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
            return WeatherCondition.RAIN;
        }

        if (weatherCode >= 71 && weatherCode <= 77) {
            return WeatherCondition.SNOW;
        }

        if (weatherCode == 96 || weatherCode == 99) {
            return WeatherCondition.HAIL;
        }

        if (weatherCode == 95) {
            return WeatherCondition.STORM;
        }

        return WeatherCondition.CLOUDY;
    }

    private static String createLocationLabel(GeocodingResult result) {
        return Stream.of(result.name(), result.admin1(), result.country())
                .filter(value -> value != null && !value.isBlank())
                .reduce((left, right) -> left + ", " + right)
                .orElse(result.name());
    }

    private static String normalizeGeocodingText(String value) {
        if (value == null) {
            return "";
        }

        return java.text.Normalizer.normalize(value.toLowerCase(Locale.ROOT), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private static String compactGeocodingText(String value) {
        return value.replaceAll("\\s+", "");
    }

    private static String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        return value.replaceAll("/+$", "");
    }

    record GeocodingResponse(List<GeocodingResult> results) {
    }

    record GeocodingResult(
            String name,
            String country,
            String admin1,
            double latitude,
            double longitude,
            Double elevation,
            Long population,
            @JsonProperty("feature_code") String featureCode
    ) {
    }

    record WeatherApiResponse(WeatherApiCurrent current) {
    }

    record WeatherApiCurrent(
            @JsonProperty("temperature_2m") Double temperatureC,
            @JsonProperty("weather_code") Integer weatherCode,
            @JsonProperty("is_day") Integer isDay
    ) {
    }
}
