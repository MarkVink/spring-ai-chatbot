package com.example.springaichatbot.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.mail.from}") String fromAddress
    ) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    public void sendAppointmentConfirmation(String toEmail, String postcode, String huisnummer, String datum, String tijd) {
        log.info("Bevestigingsmail verzenden naar: {}", toEmail);

        try {
            var mimeMessage = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Bevestiging van uw afspraak op " + datum);

            String htmlContent = """
                    <html>
                    <body style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #0d9488;">Afspraakbevestiging</h2>
                        <p>Beste klant,</p>
                        <p>Uw afspraak is succesvol ingepland. Hieronder vindt u de details:</p>
                        <table style="border-collapse: collapse; margin: 16px 0;">
                            <tr>
                                <td style="padding: 8px 16px; font-weight: bold;">Adres:</td>
                                <td style="padding: 8px 16px;">%s %s</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 16px; font-weight: bold;">Datum:</td>
                                <td style="padding: 8px 16px;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 16px; font-weight: bold;">Tijd:</td>
                                <td style="padding: 8px 16px;">%s</td>
                            </tr>
                        </table>
                        <p>Heeft u vragen of wilt u de afspraak wijzigen? Neem dan contact met ons op.</p>
                        <p>Met vriendelijke groet,<br/>Het Afspraak Team</p>
                    </body>
                    </html>
                    """.formatted(postcode, huisnummer, datum, tijd);

            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);

            log.info("Bevestigingsmail succesvol verzonden naar: {}", toEmail);
        } catch (Exception e) {
            log.error("Fout bij verzenden bevestigingsmail naar {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Kon bevestigingsmail niet verzenden: " + e.getMessage(), e);
        }
    }
}

