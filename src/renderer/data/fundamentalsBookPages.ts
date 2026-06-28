/**
 * Primary instruction page(s) per book exercise (David Petrov — 25 Drawing Exercises).
 * Excludes level intros, FAQ, scaffolding, homework blanks, and answer keys.
 */
export const FUNDAMENTALS_BOOK_PAGES: Record<number, readonly number[]> = {
  1: [7], // 01. Straights and Curves
  2: [8], // 02. Point Coordination
  3: [9], // 03. Tilting Planes
  4: [10], // 04. Parallel Ellipses
  5: [11], // 05. Ribbons
  6: [13], // 06. Extrusion
  7: [15, 16], // 07. Cube Grid + Expanded Cube Grid
  8: [18, 19], // 08. Cylinders + Cylinder Variations
  9: [20], // 09. Rotating Forms
  10: [26], // 10. Box Stacking
  11: [28], // 11. Intersections
  12: [31], // 12. Stack & Queue
  13: [33], // 13. Bending Forms
  14: [35], // 14. Organic Forms
  15: [40], // 15. Texture Bar
  16: [43], // 16. Carving
  17: [47], // 17. Form Cluster
  18: [49], // 18. Box Figures
  19: [51], // 19. Volume Mapping
  20: [55], // 20. Deconstruction
  21: [58], // 21. Mannequinization
  22: [61], // 22. Magic Observation
  23: [63], // 23. POV Drawing
  24: [68], // 24. Daily Highlight
  25: [75], // 25. Comic Book
} as const

export function getFundamentalsBookPagesForOrder(bookOrder: number): number[] {
  return [...(FUNDAMENTALS_BOOK_PAGES[bookOrder] ?? [])]
}
