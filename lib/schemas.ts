import { z } from 'zod';

export const formInputSchema = z
  .object({
    transportationMethods: z
      .array(z.enum(['drive', 'connector', 'walk', 'cycle']))
      .min(1, 'Please select at least one transportation method')
      .refine(
        (methods) => {
          // Ensure all values are unique
          return new Set(methods).size === methods.length;
        },
        { message: 'Duplicate transportation methods are not allowed' }
      ),

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
      // If any transportation method is drive, walk, or cycle, Microsoft building is required
      const requiresMicrosoftBuilding = data.transportationMethods.some(
        (method) => method === 'drive' || method === 'walk' || method === 'cycle'
      );

      if (requiresMicrosoftBuilding && !data.microsoftBuilding) {
        return false;
      }
      return true;
    },
    {
      message: 'Microsoft building is required when using drive, walk, or cycle transportation methods',
      path: ['microsoftBuilding'],
    }
  )
  .refine(
    (data) => {
      // If transportation methods include connector, radius time is required
      if (data.transportationMethods.includes('connector') && !data.radiusTimeMinutes) {
        return false;
      }
      return true;
    },
    {
      message: 'Walking time to shuttle stop is required when using Microsoft Connector',
      path: ['radiusTimeMinutes'],
    }
  );

export type FormInputType = z.infer<typeof formInputSchema>;
