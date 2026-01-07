import { z } from 'zod';

/**
 * Schema for template position (anchor + offset)
 */
export const TemplatePositionSchema = z.object({
  anchor: z.enum([
    'center',
    'top-center',
    'bottom-center',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ]),
  offsetX: z.number(),
  offsetY: z.number(),
});

/**
 * Schema for mask shapes
 */
export const MaskShapeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  z.object({ type: z.literal('circle') }),
  z.object({ type: z.literal('rounded-rect'), radius: z.number().positive() }),
]);

/**
 * Schema for text style
 */
export const TextStyleSchema = z.object({
  fontFamily: z.string().min(1),
  fontSize: z.number().positive(),
  color: z.string().min(1),
  align: z.enum(['left', 'center', 'right']).optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  stroke: z
    .object({
      width: z.number().nonnegative(),
      color: z.string().min(1),
    })
    .optional(),
  shadow: z
    .object({
      blur: z.number().nonnegative(),
      offsetX: z.number(),
      offsetY: z.number(),
      color: z.string().min(1),
    })
    .optional(),
  maxWidth: z.number().positive().optional(),
});

/**
 * Schema for text field definition
 */
export const TemplateTextFieldSchema = z.object({
  id: z.string().min(1),
  position: TemplatePositionSchema,
  style: TextStyleSchema,
  placeholder: z.string().optional(),
});

/**
 * Schema for photo field definition
 */
export const TemplatePhotoFieldSchema = z.object({
  id: z.string().min(1),
  position: TemplatePositionSchema,
  size: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  mask: MaskShapeSchema.optional(),
  border: z
    .object({
      width: z.number().nonnegative(),
      color: z.string().min(1),
    })
    .optional(),
  shadow: z
    .object({
      blur: z.number().nonnegative(),
      offsetX: z.number(),
      offsetY: z.number(),
      color: z.string().min(1),
    })
    .optional(),
});

/**
 * Schema for gradient direction
 */
export const GradientDirectionSchema = z.enum([
  'to-bottom',
  'to-right',
  'to-bottom-right',
  'radial',
]);

/**
 * Schema for gradient stop
 */
export const GradientStopSchema = z.object({
  color: z.string().min(1),
  position: z.number().min(0).max(100),
});

/**
 * Schema for template background
 */
export const TemplateBackgroundSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('solid'), color: z.string().min(1) }),
  z.object({
    type: z.literal('gradient'),
    direction: GradientDirectionSchema,
    stops: z.array(GradientStopSchema).min(2),
  }),
  z.object({ type: z.literal('image'), path: z.string().min(1) }),
]);

/**
 * Schema for complete poster template
 */
export const PosterTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (e.g., 1.0.0)'),
  canvas: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  background: TemplateBackgroundSchema,
  photos: z.array(TemplatePhotoFieldSchema).min(1),
  text: z.array(TemplateTextFieldSchema),
});

/**
 * Inferred type from the schema
 */
export type PosterTemplateInput = z.input<typeof PosterTemplateSchema>;
