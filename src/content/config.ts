import { defineCollection, z } from 'astro:content';

const works = defineCollection({
  schema:({ image }) => z.object({
    name: z.string(),
    title: z.string(),
    year: z.string(),
    image: image(),
    art: z.boolean(),
    material:z.string(),
    seenIn:z.string(),
    externalLink: z.string().url().optional(),
    estilo: z.string().optional(),
    videoopcional:z.string().optional(),
    priority:z.number().optional()
  })
});

export const collections = {
  'works': works
};