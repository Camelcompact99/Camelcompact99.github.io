import { defineCollection, z } from 'astro:content';

const works = defineCollection({
  schema:({ image }) => z.object({
    name: z.string(),
    title: z.string(),
    year: z.string(),
    image: image(),
    material:z.string(),
    seenIn:z.string(),
    externalLink: z.string().url().optional(),
    estilo: z.string().optional(),
  })
});

export const collections = {
  'works': works
};