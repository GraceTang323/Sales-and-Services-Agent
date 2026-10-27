import { validateAutomationBody, type ExistingGradualRolloutData } from '../interfaces/http/validators/automationValidator.js';
import { evaluateFlag } from '../interfaces/http/evaluation/engine.js';

describe('Gradual Rollout Automation', () => {
  describe('validateAutomationBody', () => {
    it('should set startedAt to current time when creating new gradual rollout', () => {
      const body = {
        type: 'gradualRollout',
        from: 0,
        to: 100,
        endsAt: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      };

      const before = Date.now();
      const result = validateAutomationBody('gradualRollout', body);
      const after = Date.now();

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      const data = result.data as { from: number; to: number; startedAt: Date; endsAt: Date };
      expect(data.startedAt.getTime()).toBeGreaterThanOrEqual(before - 1000);
      expect(data.startedAt.getTime()).toBeLessThanOrEqual(after + 1000);
    });

    it('should preserve existing startedAt when editing gradual rollout', () => {
      const originalStartedAt = new Date(Date.now() - 86400000); // yesterday
      const existingRollout: ExistingGradualRolloutData = {
        from: 0,
        to: 100,
        startedAt: originalStartedAt,
        endsAt: new Date(Date.now() + 86400000),
      };

      const body = {
        type: 'gradualRollout',
        from: 0,
        to: 100,
        endsAt: new Date(Date.now() + 172800000).toISOString(), // day after tomorrow (extended)
      };

      const result = validateAutomationBody('gradualRollout', body, existingRollout);

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      const data = result.data as { from: number; to: number; startedAt: Date; endsAt: Date };
      expect(data.startedAt.getTime()).toBe(originalStartedAt.getTime());
    });

    it('should preserve startedAt even when changing from/to values', () => {
      const originalStartedAt = new Date(Date.now() - 172800000); // 2 days ago
      const existingRollout: ExistingGradualRolloutData = {
        from: 0,
        to: 100,
        startedAt: originalStartedAt,
        endsAt: new Date(Date.now() + 86400000),
      };

      const body = {
        type: 'gradualRollout',
        from: 10, // Changed from 0
        to: 90,   // Changed from 100
        endsAt: new Date(Date.now() + 172800000).toISOString(),
      };

      const result = validateAutomationBody('gradualRollout', body, existingRollout);

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      const data = result.data as { from: number; to: number; startedAt: Date; endsAt: Date };
      expect(data.startedAt.getTime()).toBe(originalStartedAt.getTime());
      expect(data.from).toBe(10);
      expect(data.to).toBe(90);
    });

    it('should handle existingStartedAt as string (from JSON)', () => {
      const originalStartedAt = new Date(Date.now() - 86400000).toISOString();
      const existingRollout: ExistingGradualRolloutData = {
        from: 0,
        to: 100,
        startedAt: originalStartedAt,
        endsAt: new Date(Date.now() + 86400000).toISOString(),
      };

      const body = {
        type: 'gradualRollout',
        from: 0,
        to: 100,
        endsAt: new Date(Date.now() + 172800000).toISOString(),
      };

      const result = validateAutomationBody('gradualRollout', body, existingRollout);

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      const data = result.data as { from: number; to: number; startedAt: Date; endsAt: Date };
      expect(data.startedAt.getTime()).toBe(new Date(originalStartedAt).getTime());
    });

    it('should handle missing existingRollout (creates new startedAt)', () => {
      const body = {
        type: 'gradualRollout',
        from: 0,
        to: 100,
        endsAt: new Date(Date.now() + 86400000).toISOString(),
      };

      const before = Date.now();
      const result = validateAutomationBody('gradualRollout', body, undefined);
      const after = Date.now();

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      const data = result.data as { from: number; to: number; startedAt: Date; endsAt: Date };
      expect(data.startedAt.getTime()).toBeGreaterThanOrEqual(before - 1000);
      expect(data.startedAt.getTime()).toBeLessThanOrEqual(after + 1000);
    });
  });

  describe('Evaluation Consistency', () => {
    it('should return consistent variation before and after rollout edit', () => {
      // Create flag with gradual rollout
      const flag = {
        key: 'test-flag',
        variations: [
          { key: 'off', value: false },
          { key: 'on', value: true },
        ],
        environments: {
          production: {
            enabled: true,
            defaultVariation: 'on',
            offVariation: 'off',
            gradualRollout: {
              from: 0,
              to: 100,
              startedAt: new Date(Date.now() - 43200000), // 12 hours ago
              endsAt: new Date(Date.now() + 43200000),     // 12 hours from now (at 50%)
            },
          },
        },
      };

      const userContext = { userId: 'user-123', email: 'user@example.com' };

      // Evaluate before edit
      const resultBefore = evaluateFlag(flag, 'production', userContext);

      // Simulate editing the rollout (extending end date) - startedAt should be preserved
      const existingRollout: ExistingGradualRolloutData = {
        from: 0,
        to: 100,
        startedAt: flag.environments.production.gradualRollout.startedAt,
        endsAt: flag.environments.production.gradualRollout.endsAt,
      };

      const body = {
        type: 'gradualRollout',
        from: 0,
        to: 100,
        endsAt: new Date(Date.now() + 86400000).toISOString(), // Extend to 24 hours from now
      };

      const validationResult = validateAutomationBody('gradualRollout', body, existingRollout);
      const updatedRollout = validationResult.data as { from: number; to: number; startedAt: Date; endsAt: Date };

      // Update flag with new rollout config (but preserved startedAt)
      const updatedFlag = {
        ...flag,
        environments: {
          production: {
            ...flag.environments.production,
            gradualRollout: updatedRollout,
          },
        },
      };

      // Evaluate after edit
      const resultAfter = evaluateFlag(updatedFlag, 'production', userContext);

      // Same user should get same variation
      expect(resultAfter.variation).toBe(resultBefore.variation);
      expect(resultAfter.value).toBe(resultBefore.value);
    });

    it('should return different variation if startedAt is reset (demonstrating the bug)', () => {
      // This test demonstrates what would happen if the bug weren't fixed
      const flag = {
        key: 'test-flag',
        variations: [
          { key: 'off', value: false },
          { key: 'on', value: true },
        ],
        environments: {
          production: {
            enabled: true,
            defaultVariation: 'on',
            offVariation: 'off',
            gradualRollout: {
              from: 0,
              to: 100,
              startedAt: new Date(Date.now() - 43200000), // 12 hours ago (at 50%)
              endsAt: new Date(Date.now() + 43200000),
            },
          },
        },
      };

      const userContext = { userId: 'user-999', email: 'user999@example.com' };

      // Evaluate before edit (at 50% rollout)
      const resultBefore = evaluateFlag(flag, 'production', userContext);

      // Simulate the BUG: editing rollout WITHOUT preserving startedAt
      const buggyBody = {
        type: 'gradualRollout',
        from: 0,
        to: 100,
        endsAt: new Date(Date.now() + 86400000).toISOString(),
      };

      // Pass undefined to simulate old behavior (not preserving startedAt)
      const buggyValidation = validateAutomationBody('gradualRollout', buggyBody, undefined);
      const buggyRollout = buggyValidation.data as { from: number; to: number; startedAt: Date; endsAt: Date };

      // Update flag with BUGGY rollout (startedAt reset to now)
      const buggyFlag = {
        ...flag,
        environments: {
          production: {
            ...flag.environments.production,
            gradualRollout: buggyRollout,
          },
        },
      };

      // Evaluate with buggy config
      const resultBuggy = evaluateFlag(buggyFlag, 'production', userContext);

      // With the bug, the rollout percentage resets to ~0%, so variation may change
      // This demonstrates why preserving startedAt is critical
      // (We don't assert exact values since it depends on hash, but the rollout % changes)
      const buggyPercentage = 0; // effectively, since startedAt is now
      const expectedPercentage = 50; // if preserved

      expect(buggyRollout.startedAt.getTime()).not.toBe(
        flag.environments.production.gradualRollout.startedAt.getTime()
      );
      expect(buggyRollout.startedAt.getTime()).toBeGreaterThan(
        flag.environments.production.gradualRollout.startedAt.getTime()
      );
    });
  });

  describe('Scheduled Change Automation', () => {
    it('should not be affected by existingRollout parameter', () => {
      const body = {
        type: 'scheduledChange',
        action: 'enable',
        runAt: new Date(Date.now() + 3600000).toISOString(),
      };

      const existingRollout: ExistingGradualRolloutData = {
        from: 0,
        to: 100,
        startedAt: new Date(Date.now() - 86400000),
        endsAt: new Date(Date.now() + 86400000),
      };

      // This should work fine, scheduled changes ignore existingRollout
      const result = validateAutomationBody('scheduledChange', body, existingRollout);

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      const data = result.data as { action: string; runAt: Date; approved: boolean };
      expect(data.action).toBe('enable');
      expect(data.approved).toBe(false);
    });
  });
});
