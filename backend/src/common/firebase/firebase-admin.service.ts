import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private ready = false;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length > 0) {
      this.ready = true;
      return;
    }

    const jsonInline = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    const jsonPath = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');

    try {
      let serviceAccount: admin.ServiceAccount;
      if (jsonInline) {
        serviceAccount = JSON.parse(jsonInline) as admin.ServiceAccount;
      } else if (jsonPath) {
        serviceAccount = JSON.parse(
          readFileSync(jsonPath, 'utf8'),
        ) as admin.ServiceAccount;
      } else {
        this.logger.warn(
          'Firebase not configured — set FIREBASE_SERVICE_ACCOUNT_PATH',
        );
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.ready = true;
      this.logger.log('Firebase Admin initialized');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Firebase Admin init failed: ${message}`);
    }
  }

  get isReady(): boolean {
    return this.ready;
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.ready) {
      throw new Error('Firebase is not configured on the server');
    }
    return admin.auth().verifyIdToken(idToken);
  }

  messaging() {
    return admin.messaging();
  }
}
