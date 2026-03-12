package com.example.springaichatbot.tools;

import com.example.springaichatbot.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;

import java.util.Set;

public class EmailConfirmationTool {

    private static final Logger log = LoggerFactory.getLogger(EmailConfirmationTool.class);
    private static final String TOOL_KEY = "sendConfirmationEmail";

    private final EmailService emailService;
    private final Set<String> calledTools;

    public EmailConfirmationTool(EmailService emailService, Set<String> calledTools) {
        this.emailService = emailService;
        this.calledTools = calledTools;
    }

    @Tool(description = "Verstuurt een bevestigingsmail naar de gebruiker met de afspraakgegevens. Gebruik deze tool alleen wanneer de gebruiker heeft aangegeven een bevestiging per e-mail te willen ontvangen en een geldig e-mailadres heeft opgegeven.")
    public String sendConfirmationEmail(
            @ToolParam(description = "Het e-mailadres van de gebruiker") String email,
            @ToolParam(description = "De postcode van het adres, bijv. 1234AB") String postcode,
            @ToolParam(description = "Het huisnummer, bijv. 12 of 12a") String huisnummer,
            @ToolParam(description = "De datum van de afspraak in formaat YYYY-MM-DD, bijv. 2026-03-15") String datum,
            @ToolParam(description = "Het tijdstip van de afspraak in formaat HH:mm, bijv. 14:30") String tijd
    ) {
        if (!calledTools.add(TOOL_KEY)) {
            log.info("sendConfirmationEmail was already called for this session, skipping duplicate.");
            return "Er is al eerder een bevestigingsmail verzonden in deze sessie. Geen actie ondernomen.";
        }

        try {
            emailService.sendAppointmentConfirmation(email, postcode, huisnummer, datum, tijd);
            return "Bevestigingsmail succesvol verzonden naar " + email + ".";
        } catch (Exception e) {
            log.error("Fout bij verzenden e-mail: {}", e.getMessage());
            // Remove the key so a retry is possible on failure
            calledTools.remove(TOOL_KEY);
            return "Het is helaas niet gelukt om de bevestigingsmail te verzenden naar " + email + ". De afspraak is wel geboekt.";
        }
    }
}

