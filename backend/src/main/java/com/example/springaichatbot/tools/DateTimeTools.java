package com.example.springaichatbot.tools;

import org.springframework.ai.tool.annotation.Tool;

import java.time.ZonedDateTime;

public class DateTimeTools {
    @Tool(description = "Geeft de huidige datum en tijd terug in Europe/Amsterdam timezone. Gebruik deze tool wanneer de gebruiker relatieve datums noemt zoals vandaag, morgen, overmorgen, volgende week of komende vrijdag.")
    public String getCurrentDateTime() {
        return ZonedDateTime.now(java.time.ZoneId.of("Europe/Amsterdam")).toString();
    }
}
