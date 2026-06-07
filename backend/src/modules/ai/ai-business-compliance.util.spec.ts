import {
  ADMIN_DELETE_CUSTOMER_DATA_PROMPTS,
  CONFIGURE_GRANULAR_CONSENT_PROMPTS,
  CONFIGURE_PRIVACY_RETENTION_PROMPTS,
  ACCEPT_HIPAA_BAA_PROMPTS,
  CONFIGURE_HIPAA_SESSION_TIMEOUT_PROMPTS,
  ENABLE_HIPAA_MODE_PROMPTS,
  EXPLAIN_COMPLIANCE_STATUS_PROMPTS,
  EXPLAIN_GDPR_CHECKLIST_PROMPTS,
  EXPLAIN_HIPAA_SESSION_TIMEOUT_PROMPTS,
  LIST_SUB_PROCESSORS_PROMPTS,
  EXPLAIN_MINIMUM_NECESSARY_PHI_ACCESS_PROMPTS,
  EXPLAIN_PHI_ENCRYPTION_STATUS_PROMPTS,
  LIST_BREACH_INCIDENTS_PROMPTS,
  REPORT_DATA_BREACH_PROMPTS,
  SEND_BREACH_NOTIFICATION_PROMPTS,
  OPEN_COMPLIANCE_DASHBOARD_PROMPTS,
  VIEW_PHI_ACCESS_AUDIT_PROMPTS,
} from './ai-business-compliance.fixtures.js';
import {
  isAdminDeleteCustomerDataPrompt,
  isConfigureGranularConsentPrompt,
  isConfigurePrivacyRetentionPrompt,
  isAcceptHipaaBaaPrompt,
  isConfigureHipaaSessionTimeoutPrompt,
  isEnableHipaaModePrompt,
  isExplainComplianceStatusPrompt,
  isExplainGdprChecklistPrompt,
  isExplainHipaaSessionTimeoutPrompt,
  isListSubProcessorsPrompt,
  isExplainMinimumNecessaryPhiAccessPrompt,
  isExplainPhiEncryptionStatusPrompt,
  isListBreachIncidentsPrompt,
  isReportDataBreachPrompt,
  isSendBreachNotificationPrompt,
  isOpenComplianceDashboardPrompt,
  isViewPhiAccessAuditPrompt,
  parseAcceptHipaaBaaFromPrompt,
  parseAdminDeleteCustomerDataFromPrompt,
  parseConfigureGranularConsentFromPrompt,
  parseConfigureHipaaSessionTimeoutFromPrompt,
  parseConfigurePrivacyRetentionFromPrompt,
  parseEnableHipaaModeFromPrompt,
  parseExplainComplianceStatusFromPrompt,
  parseExplainGdprChecklistFromPrompt,
  parseExplainHipaaSessionTimeoutFromPrompt,
  parseListSubProcessorsFromPrompt,
  parseExplainMinimumNecessaryPhiAccessFromPrompt,
  parseExplainPhiEncryptionStatusFromPrompt,
  parseListBreachIncidentsFromPrompt,
  parseReportDataBreachFromPrompt,
  parseSendBreachNotificationFromPrompt,
  parseOpenComplianceDashboardFromPrompt,
  parseViewPhiAccessAuditFromPrompt,
  rescueBusinessComplianceIntent,
} from './ai-business-compliance.util.js';

describe('ai-business-compliance.util', () => {
  it.each(CONFIGURE_PRIVACY_RETENTION_PROMPTS)(
    'detects configure_privacy_retention for $id',
    ({
      prompt,
      customerPiiDays,
      bookingHistoryDays,
      auditLogsDays,
      cookieBannerEnabled,
    }) => {
      expect(isConfigurePrivacyRetentionPrompt(prompt)).toBe(true);
      expect(isConfigureGranularConsentPrompt(prompt)).toBe(false);
      const parsed = parseConfigurePrivacyRetentionFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (customerPiiDays != null) {
        expect(parsed?.retention?.customerPiiDays).toBe(customerPiiDays);
      }
      if (bookingHistoryDays != null) {
        expect(parsed?.retention?.bookingHistoryDays).toBe(bookingHistoryDays);
      }
      if (auditLogsDays != null) {
        expect(parsed?.retention?.auditLogsDays).toBe(auditLogsDays);
      }
      if (cookieBannerEnabled != null) {
        expect(parsed?.cookieBanner?.enabled).toBe(cookieBannerEnabled);
      }
    },
  );

  it.each(CONFIGURE_GRANULAR_CONSENT_PROMPTS)(
    'detects configure_granular_consent for $id',
    ({ prompt, requireAiProcessing, requireThirdPartyIntegrations }) => {
      expect(isConfigureGranularConsentPrompt(prompt)).toBe(true);
      expect(isConfigurePrivacyRetentionPrompt(prompt)).toBe(false);
      const parsed = parseConfigureGranularConsentFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (requireAiProcessing != null) {
        expect(parsed?.requireAiProcessing).toBe(requireAiProcessing);
      }
      if (requireThirdPartyIntegrations != null) {
        expect(parsed?.requireThirdPartyIntegrations).toBe(
          requireThirdPartyIntegrations,
        );
      }
    },
  );

  it('rescues privacy retention before granular consent', () => {
    expect(
      rescueBusinessComplianceIntent(
        'Keep customer data for 3 years',
        'unknown',
      ),
    ).toEqual({
      action: 'configure_privacy_retention',
      rescueReason: 'configure_privacy_retention',
    });
    expect(
      rescueBusinessComplianceIntent(
        'Require AI processing consent at checkout',
        'unknown',
      ),
    ).toEqual({
      action: 'configure_granular_consent',
      rescueReason: 'configure_granular_consent',
    });
  });

  it.each(ENABLE_HIPAA_MODE_PROMPTS)(
    'detects enable_hipaa_mode for $id',
    ({ prompt, enabled, sessionTimeoutMinutes }) => {
      expect(isEnableHipaaModePrompt(prompt)).toBe(true);
      expect(isConfigureHipaaSessionTimeoutPrompt(prompt)).toBe(false);
      expect(isExplainComplianceStatusPrompt(prompt)).toBe(false);
      const parsed = parseEnableHipaaModeFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (enabled != null) {
        expect(parsed?.enabled).toBe(enabled);
      }
      if (sessionTimeoutMinutes != null) {
        expect(parsed?.sessionTimeoutMinutes).toBe(sessionTimeoutMinutes);
      }
    },
  );

  it.each(CONFIGURE_HIPAA_SESSION_TIMEOUT_PROMPTS)(
    'detects configure_hipaa_session_timeout for $id',
    ({ prompt, sessionTimeoutMinutes }) => {
      expect(isConfigureHipaaSessionTimeoutPrompt(prompt)).toBe(true);
      expect(isEnableHipaaModePrompt(prompt)).toBe(false);
      const parsed = parseConfigureHipaaSessionTimeoutFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      expect(parsed?.sessionTimeoutMinutes).toBe(sessionTimeoutMinutes);
      expect(rescueBusinessComplianceIntent(prompt, 'unknown')?.action).toBe(
        'configure_hipaa_session_timeout',
      );
    },
  );

  it.each(EXPLAIN_HIPAA_SESSION_TIMEOUT_PROMPTS)(
    'detects explain_hipaa_session_timeout for $id',
    ({ prompt, personalLogout }) => {
      expect(isExplainHipaaSessionTimeoutPrompt(prompt)).toBe(true);
      expect(isExplainComplianceStatusPrompt(prompt)).toBe(false);
      const parsed = parseExplainHipaaSessionTimeoutFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      expect(parsed?.personalLogout).toBe(personalLogout);
      expect(rescueBusinessComplianceIntent(prompt, 'unknown')?.action).toBe(
        'explain_hipaa_session_timeout',
      );
    },
  );

  it.each(ACCEPT_HIPAA_BAA_PROMPTS)(
    'detects accept_hipaa_baa for $id',
    ({ prompt, enableHipaa }) => {
      expect(isAcceptHipaaBaaPrompt(prompt)).toBe(true);
      expect(isEnableHipaaModePrompt(prompt)).toBe(false);
      const parsed = parseAcceptHipaaBaaFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (enableHipaa != null) {
        expect(parsed?.enableHipaa).toBe(enableHipaa);
      }
      expect(rescueBusinessComplianceIntent(prompt, 'unknown')?.action).toBe(
        'accept_hipaa_baa',
      );
    },
  );

  it('does not route BAA status questions to accept_hipaa_baa', () => {
    expect(isAcceptHipaaBaaPrompt('What is our HIPAA BAA status?')).toBe(false);
    expect(
      rescueBusinessComplianceIntent('What is our HIPAA BAA status?', 'unknown')
        ?.action,
    ).toBe('explain_compliance_status');
  });

  it('routes timeout-only mutate prompts away from enable_hipaa_mode', () => {
    expect(
      rescueBusinessComplianceIntent(
        'Set HIPAA timeout to 10 minutes',
        'unknown',
      )?.action,
    ).toBe('configure_hipaa_session_timeout');
    expect(
      rescueBusinessComplianceIntent(
        'Set 15-minute session timeout for HIPAA',
        'unknown',
      )?.action,
    ).toBe('enable_hipaa_mode');
  });

  it.each(
    ADMIN_DELETE_CUSTOMER_DATA_PROMPTS.filter(
      (entry) => 'customerName' in entry && entry.customerName != null,
    ),
  )(
    'detects admin_delete_customer_data for $id',
    ({ prompt, customerName }) => {
      expect(isAdminDeleteCustomerDataPrompt(prompt)).toBe(true);
      const parsed = parseAdminDeleteCustomerDataFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      expect(parsed?.customerName).toBe(customerName);
      expect(rescueBusinessComplianceIntent(prompt, 'unknown')?.action).toBe(
        'admin_delete_customer_data',
      );
    },
  );

  it('does not route self-service privacy delete to admin_delete', () => {
    expect(isAdminDeleteCustomerDataPrompt('Delete my account data')).toBe(
      false,
    );
    expect(
      rescueBusinessComplianceIntent('Delete my account data', 'unknown'),
    ).toBeNull();
  });

  it.each(LIST_SUB_PROCESSORS_PROMPTS)(
    'detects list_sub_processors for $id',
    ({ prompt, article28 }) => {
      expect(isListSubProcessorsPrompt(prompt)).toBe(true);
      expect(isExplainComplianceStatusPrompt(prompt)).toBe(false);
      const parsed = parseListSubProcessorsFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (article28 != null) {
        expect(parsed?.article28).toBe(article28);
      }
      expect(rescueBusinessComplianceIntent(prompt, 'unknown')?.action).toBe(
        'list_sub_processors',
      );
    },
  );

  it.each(EXPLAIN_GDPR_CHECKLIST_PROMPTS)(
    'detects explain_gdpr_checklist for $id',
    ({ prompt, aspect }) => {
      expect(isExplainGdprChecklistPrompt(prompt)).toBe(true);
      expect(isExplainComplianceStatusPrompt(prompt)).toBe(false);
      const parsed = parseExplainGdprChecklistFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      expect(parsed?.aspect).toBe(aspect);
      expect(rescueBusinessComplianceIntent(prompt, 'unknown')?.action).toBe(
        'explain_gdpr_checklist',
      );
    },
  );

  it.each(EXPLAIN_COMPLIANCE_STATUS_PROMPTS)(
    'detects explain_compliance_status for $id',
    ({ prompt, aspect }) => {
      expect(isExplainComplianceStatusPrompt(prompt)).toBe(true);
      expect(isEnableHipaaModePrompt(prompt)).toBe(false);
      const parsed = parseExplainComplianceStatusFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      expect(parsed?.aspect).toBe(aspect);
    },
  );

  it.each(LIST_BREACH_INCIDENTS_PROMPTS)(
    'detects list_breach_incidents for $id',
    ({ prompt, aspect }) => {
      expect(isListBreachIncidentsPrompt(prompt)).toBe(true);
      expect(isExplainComplianceStatusPrompt(prompt)).toBe(false);
      const parsed = parseListBreachIncidentsFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      expect(parsed?.aspect).toBe(aspect);
      expect(rescueBusinessComplianceIntent(prompt, 'unknown')?.action).toBe(
        'list_breach_incidents',
      );
    },
  );

  it.each(VIEW_PHI_ACCESS_AUDIT_PROMPTS)(
    'detects view_phi_access_audit for $id',
    ({ prompt, daysBack, fieldName }) => {
      expect(isViewPhiAccessAuditPrompt(prompt)).toBe(true);
      const parsed = parseViewPhiAccessAuditFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (daysBack != null) {
        expect(parsed?.daysBack).toBe(daysBack);
      }
      if (fieldName != null) {
        expect(parsed?.fieldName).toBe(fieldName);
      }
      expect(rescueBusinessComplianceIntent(prompt, 'unknown')?.action).toBe(
        'view_phi_access_audit',
      );
    },
  );

  it.each(EXPLAIN_PHI_ENCRYPTION_STATUS_PROMPTS)(
    'detects explain_phi_encryption_status for $id',
    ({ prompt, fieldName }) => {
      expect(isExplainPhiEncryptionStatusPrompt(prompt)).toBe(true);
      const parsed = parseExplainPhiEncryptionStatusFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (fieldName != null) {
        expect(parsed?.fieldName).toBe(fieldName);
      }
      expect(rescueBusinessComplianceIntent(prompt, 'unknown')?.action).toBe(
        'explain_phi_encryption_status',
      );
    },
  );

  it.each(EXPLAIN_MINIMUM_NECESSARY_PHI_ACCESS_PROMPTS)(
    'detects explain_minimum_necessary_phi_access for $id',
    ({ prompt, aspect }) => {
      expect(isExplainMinimumNecessaryPhiAccessPrompt(prompt)).toBe(true);
      expect(isViewPhiAccessAuditPrompt(prompt)).toBe(false);
      const parsed = parseExplainMinimumNecessaryPhiAccessFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      expect(parsed?.aspect).toBe(aspect);
      expect(rescueBusinessComplianceIntent(prompt, 'unknown')?.action).toBe(
        'explain_minimum_necessary_phi_access',
      );
    },
  );

  it('does not route who-can-see questions to view_phi_access_audit', () => {
    expect(isViewPhiAccessAuditPrompt('Who can see patient notes?')).toBe(
      false,
    );
    expect(
      rescueBusinessComplianceIntent('Who can see patient notes?', 'unknown')
        ?.action,
    ).toBe('explain_minimum_necessary_phi_access');
  });

  it('does not route sub-processor questions to explain_compliance_status', () => {
    expect(
      rescueBusinessComplianceIntent(
        'Who are our data sub-processors?',
        'unknown',
      )?.action,
    ).toBe('list_sub_processors');
    expect(
      rescueBusinessComplianceIntent('Are we GDPR compliant?', 'unknown')
        ?.action,
    ).toBe('explain_gdpr_checklist');
  });

  it('does not route GDPR deadline questions to explain_compliance_status', () => {
    expect(
      isExplainComplianceStatusPrompt('What is our GDPR 72-hour deadline?'),
    ).toBe(false);
    expect(
      rescueBusinessComplianceIntent(
        'What is our GDPR 72-hour deadline?',
        'unknown',
      )?.action,
    ).toBe('list_breach_incidents');
  });

  it.each(REPORT_DATA_BREACH_PROMPTS)(
    'detects report_data_breach for $id',
    ({ prompt, affectedCustomerCount }) => {
      const parsed = parseReportDataBreachFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      expect(parsed?.description.length).toBeGreaterThanOrEqual(10);
      if (affectedCustomerCount != null) {
        expect(parsed?.affectedCustomerCount).toBe(affectedCustomerCount);
      }
      expect(rescueBusinessComplianceIntent(prompt, 'unknown')?.action).toBe(
        'report_data_breach',
      );
    },
  );

  it.each(SEND_BREACH_NOTIFICATION_PROMPTS)(
    'detects send_breach_notification for $id',
    ({ prompt, incidentRef }) => {
      expect(isSendBreachNotificationPrompt(prompt)).toBe(true);
      expect(isReportDataBreachPrompt(prompt)).toBe(false);
      const parsed = parseSendBreachNotificationFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      expect(parsed?.incidentRef).toBe(incidentRef);
      expect(rescueBusinessComplianceIntent(prompt, 'unknown')?.action).toBe(
        'send_breach_notification',
      );
    },
  );

  it.each(OPEN_COMPLIANCE_DASHBOARD_PROMPTS)(
    'detects open_compliance_dashboard for $id',
    ({ prompt, panel }) => {
      expect(isOpenComplianceDashboardPrompt(prompt)).toBe(true);
      const parsed = parseOpenComplianceDashboardFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      expect(parsed?.panel).toBe(panel);
      expect(rescueBusinessComplianceIntent(prompt, 'unknown')?.action).toBe(
        'open_compliance_dashboard',
      );
    },
  );

  it('does not steal breach list prompts for navigation', () => {
    expect(isOpenComplianceDashboardPrompt('Take me to breach log')).toBe(true);
    expect(isListBreachIncidentsPrompt('Take me to breach log')).toBe(false);
    expect(isListBreachIncidentsPrompt('Show breach incidents')).toBe(true);
  });

  it('does not route provider app logout to dashboard explain_hipaa_session_timeout', () => {
    expect(
      isExplainHipaaSessionTimeoutPrompt(
        'When will the provider app log me out?',
      ),
    ).toBe(false);
  });

  it('does not steal explain-style compliance questions', () => {
    expect(
      isConfigurePrivacyRetentionPrompt('What is our GDPR retention period?'),
    ).toBe(false);
    expect(
      isConfigureGranularConsentPrompt('Explain our checkout consent settings'),
    ).toBe(false);
    expect(
      rescueBusinessComplianceIntent(
        'What is our GDPR retention period?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_compliance_status',
      rescueReason: 'explain_compliance_status',
    });
  });
});
