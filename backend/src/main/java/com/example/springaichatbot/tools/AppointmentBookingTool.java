package com.example.springaichatbot.tools;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;

public class AppointmentBookingTool {

    private static final Logger log = LoggerFactory.getLogger(AppointmentBookingTool.class);

    @Tool(description = "Boekt een afspraak met de opgegeven gegevens. Gebruik deze tool wanneer de gebruiker alle afspraakgegevens heeft bevestigd (postcode, huisnummer, datum en tijd).")
    public String bookAppointment(
            @ToolParam(description = "De postcode van het adres, bijv. 1234AB") String postcode,
            @ToolParam(description = "Het huisnummer, bijv. 12 of 12a") String huisnummer,
            @ToolParam(description = "De datum van de afspraak in formaat YYYY-MM-DD, bijv. 2026-03-15") String datum,
            @ToolParam(description = "Het tijdstip van de afspraak in formaat HH:mm, bijv. 14:30") String tijd
    ) {
        log.info("=== AFSPRAAK GEBOEKT ===");
        log.info("Postcode:    {}", postcode);
        log.info("Huisnummer:  {}", huisnummer);
        log.info("Datum:       {}", datum);
        log.info("Tijd:        {}", tijd);
        log.info("========================");

        return "Afspraak succesvol geboekt voor " + datum + " om " + tijd + " op adres " + postcode + " " + huisnummer + ".";
    }
}

