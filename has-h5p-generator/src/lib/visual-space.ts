export const VISUAL_SPACE_TEMPLATE_SLIDES = [4, 7, 9, 19] as const;

export function supportsVisualSpace(templateSlide: unknown): templateSlide is (typeof VISUAL_SPACE_TEMPLATE_SLIDES)[number] {
  return typeof templateSlide === "number" &&
    VISUAL_SPACE_TEMPLATE_SLIDES.includes(templateSlide as (typeof VISUAL_SPACE_TEMPLATE_SLIDES)[number]);
}
