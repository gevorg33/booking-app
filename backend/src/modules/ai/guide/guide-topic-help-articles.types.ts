/** Optional help-center / Zendesk article mapping for a guide topicId (ai-guide-1.7.1). */
export interface GuideTopicHelpArticleMapping {
  /** Dashboard contextual help topic id (`help-center-topics.ts`). */
  helpCenterTopicId?: string;
  /** Zendesk Help Center article id (numeric string). */
  zendeskArticleId?: string;
}

/** Resolved article refs attached to `GuideResponse.helpArticle`. */
export interface GuideHelpArticleRef {
  helpCenterTopicId?: string;
  zendeskArticleId?: string;
}
