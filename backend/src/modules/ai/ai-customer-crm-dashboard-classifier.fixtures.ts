/** Dashboard customer CRM classifier rules. */
export const CUSTOMER_CRM_DASHBOARD_CLASSIFIER_RULES = `- list_packages / list_subscription_plans: READ-ONLY catalog monetization lists.
- list_customer_subscriptions / subscription_usage_history / list_customer_gift_cards / list_customer_bookings / customer_no_show_history: READ-ONLY customer 360 (requires customerName).
- extend_subscription / cancel_subscription_admin / tag_customer / merge_customers / export_customer_data / delete_customer_data / send_reengagement_message: dashboard CRM mutations.
- update_customer: MUTATE — edit an existing customer's profile fields: name, email, phone, or VIP flag. Requires customerName plus at least one of newName, email, phone, isVip. "Update Maria's email to maria@new.com" → customerName=Maria, email=maria@new.com. NOT tag_customer (segment tags: vip/regular/persona/corporate/referral), NOT update_clinical_profile (medical fields).
- my_appointments / my_subscriptions / my_gift_cards / subscription_usage / my_profile / update_my_profile: signed-in customer account (session customerId).
- request_gift_card_cancel / request_gift_card_modify / track_physical_gift_card_order / privacy_export / privacy_delete: customer self-service.
- discover_packages / discover_subscription_plans / discover_gift_card_products: public catalog discovery (not admin CRUD).`;
