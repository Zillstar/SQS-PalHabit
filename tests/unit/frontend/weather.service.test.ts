import { vi } from "vitest";
// @ts-ignore: imported source is outside the tests rootDir
import { BackendWeatherAdapter } from "../../../frontend/src/app/core/services/weather.adapter";
// @ts-ignore: imported source is outside the tests rootDir
import { WeatherService } from "../../../frontend/src/app/core/services/weather.service";

const berlinWeatherResponse = {
  condition: "cloudy",
  timeOfDay: "day",
  temperatureC: 18.2,
  weatherCode: 3,
  label: "Bewoelkt",
  locationLabel: "Berlin",
  updatedAt: "2026-05-19T13:45:00.000Z",
};

const zurichLocationResponse = {
  latitude: 47.36667,
  longitude: 8.55,
  label: "Zuerich, Kanton Zuerich, Schweiz",
};

const jakutskLocationResponse = {
  latitude: 62.03114,
  longitude: 129.72289,
  label: "Jakutsk, Sacha, Russland",
};

const jakutskWeatherResponse = {
  condition: "cloudy",
  timeOfDay: "day",
  temperatureC: 20.1,
  weatherCode: 1,
  label: "Bewoelkt",
  locationLabel: "Jakutsk, Sacha, Russland",
  updatedAt: "2026-06-16T12:00:00.000Z",
};

const hawaiiWeatherResponse = {
  condition: "clear",
  timeOfDay: "day",
  temperatureC: 26,
  weatherCode: 0,
  label: "Klar",
  locationLabel: "Hawaii Kai, Hawaii, Vereinigte Staaten",
  updatedAt: "2026-06-16T17:00:00.000Z",
};

describe("WeatherService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(berlinWeatherResponse), { status: 200 }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("speichert die gewählte Stadt und nutzt sie für weitere Aktualisierungen", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(berlinWeatherResponse), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(zurichLocationResponse), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(berlinWeatherResponse), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(berlinWeatherResponse), { status: 200 }),
      );

    const service = new WeatherService();
    service.initialize();
    await service.searchCity("Zuerich");
    await service.refresh();

    expect(service.location().label).toBe("Zuerich, Kanton Zuerich, Schweiz");
    expect(localStorage.getItem("sqs-weather-location")).toContain("Zuerich");
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("/api/weather/current?latitude=47.36667"),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("laedt eine gespeicherte Stadt beim Start", async () => {
    localStorage.setItem(
      "sqs-weather-location",
      JSON.stringify({
        latitude: 47.36667,
        longitude: 8.55,
        label: "Zuerich, Kanton Zuerich, Schweiz",
      }),
    );

    const service = new WeatherService();
    service.initialize();
    await service.refresh();

    expect(service.location().label).toBe("Zuerich, Kanton Zuerich, Schweiz");
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("/api/weather/current?latitude=47.36667"),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("migriert den alten Hawaii-Inselpunkt aus dem Browser-Speicher", async () => {
    localStorage.setItem(
      "sqs-weather-location",
      JSON.stringify({
        latitude: 19.54814,
        longitude: -155.66495,
        label: "Hawaii, Hawaii, Vereinigte Staaten",
      }),
    );

    const service = new WeatherService();
    service.initialize();
    await service.refresh();

    expect(service.location().label).toBe(
      "Hawaii Kai, Hawaii, Vereinigte Staaten",
    );
    expect(localStorage.getItem("sqs-weather-location")).toContain(
      "Hawaii Kai",
    );
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("latitude=21.29637"),
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("longitude=-157.70175"),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("nutzt den Backend-Treffer für ungenaue Stadteingaben", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(berlinWeatherResponse), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(jakutskLocationResponse), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(jakutskWeatherResponse), { status: 200 }),
      );

    const service = new WeatherService();
    service.initialize();
    await service.searchCity("jakuts");

    expect(service.location().label).toBe("Jakutsk, Sacha, Russland");
    expect(service.snapshot()).toMatchObject({
      locationLabel: "Jakutsk, Sacha, Russland",
      temperatureC: 20.1,
      weatherCode: 1,
    });
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/weather/location?city=jakuts"),
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("latitude=62.03114"),
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("longitude=129.72289"),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("uebernimmt Hawaii-Wetterdaten aus dem Backend", async () => {
    const hawaiiLocationResponse = {
      latitude: 21.29637,
      longitude: -157.70175,
      label: "Hawaii Kai, Hawaii, Vereinigte Staaten",
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(berlinWeatherResponse), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(hawaiiLocationResponse), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(hawaiiWeatherResponse), { status: 200 }),
      );

    const service = new WeatherService();
    service.initialize();
    await service.searchCity("Hawaii");

    expect(service.location().label).toBe(
      "Hawaii Kai, Hawaii, Vereinigte Staaten",
    );
    expect(service.snapshot()).toMatchObject({
      condition: "clear",
      locationLabel: "Hawaii Kai, Hawaii, Vereinigte Staaten",
      temperatureC: 26,
    });
  });

  it("fragt Stadtaufloesungen ueber den Backend-Endpoint ab", async () => {
    const adapter = new BackendWeatherAdapter();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          latitude: 35.6895,
          longitude: 139.69171,
          label: "Tokio, Tokio, Japan",
        }),
        { status: 200 },
      ),
    );

    const location = await adapter.resolveCity("Tokyo");

    expect(location.label).toBe("Tokio, Tokio, Japan");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/weather/location?city=Tokyo"),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("aktualisiert Wetter Heute automatisch alle zehn Minuten", () => {
    const service = new WeatherService();
    service.initialize();

    vi.advanceTimersByTime(10 * 60 * 1000);

    expect(service.location().label).toBe("Berlin");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("uebernimmt den Backend-Zeitstempel beim Aktualisieren", async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            ...berlinWeatherResponse,
            updatedAt: "2026-06-16T07:42:30.000Z",
          }),
          { status: 200 },
        ),
      ),
    );

    const service = new WeatherService();
    service.initialize();
    await service.refresh();

    expect(service.snapshot()?.updatedAt).toBe("2026-06-16T07:42:30.000Z");
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("/api/weather/current"),
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
