/**
 * AWS Config SDK v3 wrapper with cross-account assume-role support.
 *
 * Each account in ACCOUNTS is assumed via STS before calling Config,
 * so this can run from a single "hub" identity against an entire
 * AWS Organizations estate.
 */
import {
  ConfigServiceClient,
  GetComplianceSummaryByConfigRuleCommand,
} from "@aws-sdk/client-config-service";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

export interface AccountTarget {
  accountId: string;
  accountName: string;
  roleArn: string;
  region: string;
}

export interface ComplianceSummary {
  accountId: string;
  accountName: string;
  compliantCount: number;
  nonCompliantCount: number;
  collectedAt: string;
}

async function assumeRoleClient(target: AccountTarget): Promise<ConfigServiceClient> {
  const sts = new STSClient({ region: target.region });

  const { Credentials } = await sts.send(
    new AssumeRoleCommand({
      RoleArn: target.roleArn,
      RoleSessionName: "config-compliance-dashboard",
    })
  );

  if (!Credentials) {
    throw new Error(`Failed to assume role for account ${target.accountId}`);
  }

  return new ConfigServiceClient({
    region: target.region,
    credentials: {
      accessKeyId: Credentials.AccessKeyId!,
      secretAccessKey: Credentials.SecretAccessKey!,
      sessionToken: Credentials.SessionToken,
    },
  });
}

export async function getComplianceSummary(
  target: AccountTarget
): Promise<ComplianceSummary> {
  const client = await assumeRoleClient(target);

  // TODO: this pulls the account-wide summary; add a variant that groups
  // by individual rule name once the dashboard needs rule-level drilldown
  // rather than just a per-account compliant/non-compliant count.
  const response = await client.send(
    new GetComplianceSummaryByConfigRuleCommand({})
  );

  const summary = response.ComplianceSummary;

  return {
    accountId: target.accountId,
    accountName: target.accountName,
    compliantCount: summary?.CompliantResourceCount?.CappedCount ?? 0,
    nonCompliantCount: summary?.NonCompliantResourceCount?.CappedCount ?? 0,
    collectedAt: new Date().toISOString(),
  };
}
