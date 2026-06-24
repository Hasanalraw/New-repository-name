/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CompetitorData {
  id: string;
  name: string;
  strengths: string;
  weaknesses: string;
  mainOffer: string;
  discoveredGap: string;
}

export interface TargetAudienceData {
  demographics: string;
  painPoints: string;
  desiresAndDreams: string;
  objections: string;
}

export interface MarketingAnglesData {
  painAngle: string;
  transformationAngle: string;
  roiAngle: string;
  uniquenessAngle: string;
}

export interface MessagePillarsData {
  authorityAndTrust: string;
  speedAndEase: string;
  uniqueValue: string;
  riskReversal: string;
}

export interface ContentFormatsData {
  shortVideoUgc: string;
  carouselAndGraphics: string;
  caseStudies: string;
  directOfferAds: string;
}

export interface HooksScriptsData {
  hook1: string;
  hook2: string;
  hook3: string;
  scriptStructure: string;
}

export interface AdStrategyData {
  budgetAllocation: string;
  campaignStructure: string;
  abTestingPlan: string;
}

export interface PlatformAnswers {
  competitors: CompetitorData[];
  targetAudience: TargetAudienceData;
  marketingAngles: MarketingAnglesData;
  messagePillars: MessagePillarsData;
  contentFormats: ContentFormatsData;
  hooksScripts: HooksScriptsData;
  adStrategy: AdStrategyData;
}

export interface UserSession {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface SectionGuide {
  id: string;
  title: string;
  icon: string;
  description: string;
  tips: {
    title: string;
    description: string;
    points: string[];
    quote?: string;
  }[];
}
