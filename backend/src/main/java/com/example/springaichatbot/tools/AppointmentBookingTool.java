package com.example.springaichatbot.tools;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;

import java.util.Set;

public class AppointmentBookingTool {

    private static final Logger log = LoggerFactory.getLogger(AppointmentBookingTool.class);
    private static final String TOOL_KEY = "bookAppointment";

    private final Set<String> calledTools;

    public AppointmentBookingTool(Set<String> calledTools) {
        this.calledTools = calledTools;
    }

    @Tool(description = "Boekt een afspraak met de opgegeven gegevens. Gebruik deze tool wanneer de gebruiker alle afspraakgegevens heeft bevestigd (postcode, huisnummer, datum en tijd).")
    public String bookAppointment(
            @ToolParam(description = "De postcode van het adres, bijv. 1234AB") String postcode,
            @ToolParam(description = "Het huisnummer, bijv. 12 of 12a") String huisnummer,
            @ToolParam(description = "De datum van de afspraak in formaat YYYY-MM-DD, bijv. 2026-03-15") String datum,
            @ToolParam(description = "Het tijdstip van de afspraak in formaat HH:mm, bijv. 14:30") String tijd
    ) {
        if (!calledTools.add(TOOL_KEY)) {
            log.info("bookAppointment was already called for this session, skipping duplicate.");
            return "De afspraak is al eerder geboekt in deze sessie. Geen actie ondernomen.";
        }

        log.info("=== AFSPRAAK GEBOEKT ===");
        log.info("Postcode:    {}", postcode);
        log.info("Huisnummer:  {}", huisnummer);
        log.info("Datum:       {}", datum);
        log.info("Tijd:        {}", tijd);
        log.info("========================");

        return "Afspraak succesvol geboekt voor " + datum + " om " + tijd + " op adres " + postcode + " " + huisnummer + ".";
    }
}

