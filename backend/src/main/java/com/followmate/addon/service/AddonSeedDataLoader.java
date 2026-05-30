package com.followmate.addon.service;

import com.followmate.addon.entity.AddonMaster;
import com.followmate.addon.repository.AddonMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AddonSeedDataLoader implements CommandLineRunner {

    private final AddonMasterRepository addonMasterRepository;

    @Override
    public void run(String... args) {
        defaultAddons().forEach(addonSeed -> {
            AddonMaster addon = addonMasterRepository.findByAddonCode(addonSeed.addonCode())
                    .orElseGet(() -> AddonMaster.builder()
                            .addonCode(addonSeed.addonCode())
                            .build());

            addon.setAddonName(addonSeed.addonName());
            addon.setDescription(addonSeed.description());
            addon.setMonthlyPrice(addonSeed.monthlyPrice());
            addon.setFeatureCode(addonSeed.featureCode());
            addon.setActive(true);
            addonMasterRepository.save(addon);
        });
    }

    private List<AddonSeed> defaultAddons() {
        return List.of(
                new AddonSeed("WHATSAPP_CONNECTOR", "WhatsApp Connector",
                        "Enable WhatsApp connector access", new BigDecimal("499.00"), "WHATSAPP_CONNECTOR"),
                new AddonSeed("FACEBOOK_CONNECTOR", "Facebook Connector",
                        "Enable Facebook connector access", new BigDecimal("399.00"), "FACEBOOK_CONNECTOR"),
                new AddonSeed("INSTAGRAM_CONNECTOR", "Instagram Connector",
                        "Enable Instagram connector access", new BigDecimal("399.00"), "INSTAGRAM_CONNECTOR"),
                new AddonSeed("ADVANCED_REPORTS", "Advanced Reports",
                        "Enable premium reporting access", new BigDecimal("299.00"), "REPORTS")
        );
    }

    private record AddonSeed(
            String addonCode,
            String addonName,
            String description,
            BigDecimal monthlyPrice,
            String featureCode
    ) {
    }
}
