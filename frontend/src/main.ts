import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig)
  .then(() => console.log('%c🚀 Made by atra.consulting', 'color: #264892; font-size: 14px; font-weight: bold;'))
  .catch((err) => console.error(err));
