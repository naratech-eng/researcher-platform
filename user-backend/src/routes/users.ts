import { z } from "zod";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "node:crypto";
import { ddb } from "../db";

const RegisterSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string().min(20),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(["Farmer", "Researcher", "Student", "Admin"]),
});

export async function registerUser(req: Request): Promise<Response> {
  try {
    const payload = await req.json();
    const data = RegisterSchema.parse(payload);

    const userId = crypto.randomUUID();
    const identityId = sha256(`email:${data.email.toLowerCase()}`);
    const now = new Date().toISOString();

    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: process.env.IDENTITIES_TABLE!,
              Item: {
                IdentityId: identityId,
                UserId: userId,
                Provider: "email",
                RawId: data.email,
                CreatedAt: now,
              },
              ConditionExpression: "attribute_not_exists(IdentityId)",
            },
          },
          {
            Put: {
              TableName: process.env.USERS_TABLE!,
              Item: {
                UserId: userId,
                Role: data.role,
                Contact: { Email: data.email },
                Profile: {
                  FirstName: data.firstName,
                  LastName: data.lastName,
                },
                PasswordHash: data.passwordHash,
                Status: "Active",
                CreatedAt: now,
                UpdatedAt: now,
              },
            },
          },
        ],
      }),
    );

    return Response.json({ userId }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    if (err.name === "ConditionalCheckFailedException") {
      return Response.json({ message: "Email already in use" }, { status: 409 });
    }
    return Response.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
