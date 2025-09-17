import { z } from 'zod';

export const formInputSchema = z
  .object({
    transportationMethod: z.enum(['drive', 'connector', 'walk'], {
      message: 'Please select a valid transportation method (drive, connector, or walk)',
    }),

    totalTimeToOffice: z
      .number({
        message: 'Total time to office must be a valid number',
      })
      .min(1, 'Total time must be at least 1 minute')
      .max(180, 'Total time cannot exceed 180 minutes'),

    microsoftBuilding: z.string().optional(),

    radiusTimeMinutes: z
      .enum(['5', '10', '15'], {
        message: 'Please select a valid radius time (5, 10, or 15 minutes)',
      })
      .optional(),
  })
  .refine(
    (data) => {
      // If transportation method is drive or walk, Microsoft building is required
      if ((data.transportationMethod === 'drive' || data.transportationMethod === 'walk') && !data.microsoftBuilding) {
        return false;
      }
      return true;
    },
    {
      message: 'Microsoft building is required for drive and walk transportation methods',
      path: ['microsoftBuilding'],
    }
  );

export type FormInputType = z.infer<typeof formInputSchema>;
