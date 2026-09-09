interface BragTextProps {
  currentUserDisplayName?: string | null;
  userDisplayName?: string | null;
  leagueName?: string | null;
  awardName?: string | null;
  awardDescription?: string | null;
  awardContext?: string | null;
  draftGrade?: string | null;
  draftValue?: number | null;
}

export const generateBragText = ({
  currentUserDisplayName,
  userDisplayName,
  leagueName,
  awardName,
  awardDescription,
  awardContext,
  draftGrade,
  draftValue,
}: BragTextProps): string => {
  const siteUrl = "draftedge.ai";
  const callToAction = `See how you stack up at ${siteUrl}!`;

  if (awardName && awardDescription && awardContext) {
    const winnerText =
      currentUserDisplayName === userDisplayName
        ? "I won"
        : `${userDisplayName} won`;

    return `In my "${leagueName}" league, ${winnerText} the "${awardName}" award on DraftEdge!\n\nIt's for: "${awardDescription}"\nTheir winning stat: ${awardContext}\n\n${callToAction}`;
  }

  if (draftGrade && draftValue) {
    const valueSign = draftValue > 0 ? "+" : "";
    return `My aggregate draft profile on DraftEdge is 🔥! Grade: ${draftGrade}, Total Value: ${valueSign}${draftValue.toFixed(
      2
    )}. ${callToAction}`;
  }

  return `Check out DraftEdge for deep-analytics on your fantasy football drafts! ${siteUrl}`;
};
