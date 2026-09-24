const styles = {
  heroCard:
    "self-stretch items-center gap-ku-md rounded-ku-card bg-ku-surface-accent",
  identityContent: "items-center gap-ku-xs self-stretch",
  photoFrame:
    "items-center justify-center overflow-hidden border-[4px] border-ku-surface bg-ku-surface-image",
  photo: "h-full w-full",
  initials: "font-ku-bold text-ku-display-small text-ku-primary-dark",
  name: "text-center font-ku-bold text-ku-text-strong",
  metaList: "flex-row flex-wrap justify-center gap-x-ku-12 gap-y-ku-xs",
  metaRow: "min-w-0 shrink flex-row items-center gap-ku-6",
  meta: "shrink font-ku-regular text-ku-body-small text-ku-text",
  subtleMeta: "text-ku-text-subtle font-ku-regular text-ku-meta",
  tagGroup: "items-center gap-ku-6 self-stretch",
  tagGroupLabel: "font-ku-semibold text-ku-label text-ku-text-secondary",
  tagList: "flex-row flex-wrap justify-center gap-ku-6",
  tag: "rounded-ku-pill bg-ku-surface-accent border-ku-border-accent border px-ku-10 py-ku-xs",
  tagText: "text-ku-primary-dark font-ku-semibold text-ku-label",
  editButton: "min-h-[48px] w-full bg-ku-surface",
  editButtonText: "font-ku-semibold text-ku-body-small text-ku-primary",
  section:
    "self-stretch rounded-[16px] bg-ku-card border-ku-border-subtle border",
  statsCard:
    "self-stretch rounded-ku-card border border-ku-border bg-ku-surface px-ku-sm py-ku-md",
  statsTopRow: "flex-row items-stretch",
  statItem: "flex-1 items-center justify-center px-ku-xs",
  statValue: "font-ku-bold text-ku-title text-ku-text-strong",
  statEmptyValue:
    "text-center font-ku-semibold text-ku-body-small text-ku-text-secondary",
  statLabel:
    "mt-ku-2 text-center font-ku-medium text-ku-label text-ku-text-secondary",
  statValueRow: "flex-row items-center gap-ku-xs",
  statStar: "text-ku-control text-ku-gold",
  statDivider: "w-px self-stretch bg-ku-divider",
  sectionNotice:
    "items-center bg-ku-surface-danger border-ku-border-danger rounded-[8px] border gap-ku-sm mb-ku-md p-ku-sm",
  sectionNoticeText:
    "text-ku-danger-dark font-ku-regular text-ku-meta text-center",
  sectionRetry: "min-h-[48px] justify-center px-ku-md",
  sectionRetryText:
    "text-ku-primary-dark font-ku-semibold text-ku-meta underline",
  emptyState: "items-center gap-ku-12",
  emptyAction:
    "min-h-[48px] justify-center rounded-ku-pill bg-ku-surface-accent border-ku-border-accent border px-ku-md",
  emptyActionText: "text-ku-primary-dark font-ku-semibold text-ku-meta",
  reviewContext: "text-ku-text-secondary font-ku-regular text-ku-body-small",
  ratingDistribution: "self-stretch mt-ku-10",
  ratingDistributionRow:
    "items-center flex-row gap-ku-sm mt-ku-xs min-h-[44px]",
  ratingDistributionRowSelected: "bg-ku-surface-accent rounded-[8px] px-ku-sm",
  ratingDistributionLabel: "text-ku-text-secondary text-ku-label w-[12px]",
  ratingDistributionTrack:
    "bg-ku-border-subtle rounded-ku-pill flex-1 h-[6px] overflow-hidden",
  ratingDistributionFill: "bg-ku-primary rounded-ku-pill h-full",
  ratingDistributionCount:
    "text-ku-text-muted text-ku-label text-right w-[22px]",
  sectionTitle: "text-ku-text text-ku-section font-ku-semibold",
  rule: "h-[1px] bg-ku-border-subtle mt-ku-12 mb-ku-20",
  body: "text-ku-text-secondary font-ku-regular text-ku-body",
  emptyText: "text-ku-text-muted font-ku-regular text-ku-body-small",
  tabsScroll: "self-stretch",
  tabList: "flex-row gap-ku-sm py-ku-2",
  tab: "min-h-[48px] flex-row items-center justify-center gap-ku-6 rounded-ku-pill border border-ku-border bg-ku-surface px-ku-md",
  tabSelected: "border-ku-primary bg-ku-primary",
  tabText: "font-ku-semibold text-ku-body-small text-ku-text-secondary",
  tabTextSelected: "text-ku-on-primary",
  experience:
    "flex-row border-l-[2px] border-l-ku-border-subtle pl-ku-20 pb-ku-20",
  timelineIcon:
    "items-center bg-ku-card h-[22px] justify-center -ml-ku-31 mr-ku-10 w-[22px]",
  experienceContent: "flex-1",
  itemTitle: "text-ku-text text-ku-control font-ku-semibold",
  itemMeta: "text-ku-text-subtle font-ku-regular text-ku-meta mt-ku-2",
  itemDescription:
    "text-ku-text-secondary font-ku-regular text-ku-body-small mt-ku-6",
  previewOverlay: "items-center bg-ku-overlay flex-1 justify-center p-ku-lg",
  previewCard:
    "items-center bg-ku-card rounded-[16px] max-h-[90%] p-ku-md w-full",
  previewClose:
    "self-end min-h-[48px] min-w-[48px] items-center justify-center",
  previewScroll: "max-w-full w-full",
  previewImage: "max-w-full w-full",
  previewTitle:
    "text-ku-text font-ku-semibold text-ku-body mt-ku-sm text-center",
  grid: "gap-ku-md",
  gridRow: "flex-row gap-ku-md",
  gridSpacer: "flex-1",
  certificateCard: "flex-1 min-w-0",
  certificateImageFrame:
    "bg-ku-surface-placeholder border-ku-border-subtle rounded-[10px] border w-full items-center justify-center mb-ku-sm overflow-hidden",
  certificateImage: "h-full w-full",
  certificateIssuer: "text-ku-success font-ku-regular text-ku-meta mt-ku-2",
  previewHint: "text-ku-primary font-ku-semibold text-ku-label mt-ku-2",
  workCard: "flex-1 min-w-0",
  workImage: "w-full rounded-[10px] mb-ku-sm",
  workDetailSheet: "bg-ku-card rounded-t-[20px] max-h-[88%] mt-auto w-full",
  workDetailScroll: "w-full",
  workDetailContent: "gap-ku-md p-ku-20 pb-ku-36",
  workDetailTitle: "text-ku-text font-ku-bold text-ku-title",
  workDetailDescription: "text-ku-text-secondary font-ku-regular text-ku-body",
  workGallery: "self-stretch",
  workGalleryImage: "bg-ku-surface-placeholder rounded-[12px]",
  showAllReviews: "self-start min-h-[48px] justify-center mt-ku-xs px-ku-sm",
  showAllReviewsText: "text-ku-primary font-ku-semibold text-ku-meta underline",
  imageFallback: "items-center bg-ku-surface-terracotta justify-center",
  imageFallbackText:
    "text-ku-terracotta-dark font-ku-regular text-ku-meta text-center",
  filterScroll: "self-stretch mb-ku-md",
  filterList: "flex-row gap-ku-sm",
  filterChip:
    "border-ku-border rounded-ku-pill border min-h-[48px] justify-center px-ku-12",
  filterChipSelected: "bg-ku-primary border-ku-primary",
  filterChipText: "text-ku-text-secondary font-ku-semibold text-ku-meta",
  filterChipTextSelected: "text-ku-on-primary",
  profileListContent: "gap-ku-md",
  reviewCard:
    "bg-ku-surface-subtle border-ku-border-subtle rounded-[8px] border mt-ku-sm p-ku-md",
  reviewHeader: "flex-row items-center gap-ku-sm",
  reviewAvatar: "bg-ku-surface-image rounded-[18px] h-[36px] w-[36px]",
  reviewAvatarFallback:
    "items-center bg-ku-surface-accent rounded-[18px] h-[36px] justify-center w-[36px]",
  reviewAvatarInitials: "text-ku-primary-dark font-ku-semibold text-ku-label",
  reviewHeaderText: "flex-1",
  reviewRating: "items-center flex-row gap-ku-1 mt-ku-3",
  reviewSummary: "items-center flex-row gap-ku-md mb-ku-md",
  reviewScore: "items-center min-w-[96px]",
  reviewScoreValue: "text-ku-primary-dark font-ku-bold text-ku-display-small",
  reviewScoreEmpty:
    "text-ku-text-secondary font-ku-semibold text-ku-body-small text-center",
  reviewScoreStars: "items-center flex-row gap-ku-1 mt-ku-xs",
  reviewCount:
    "text-ku-text-muted font-ku-regular text-ku-caption mt-ku-xs text-center",
  reviewTotalQuests:
    "text-ku-text-subtle font-ku-regular text-ku-caption mt-ku-2 text-center",
  reviewDistribution: "flex-1",
} as const;

export default styles;
