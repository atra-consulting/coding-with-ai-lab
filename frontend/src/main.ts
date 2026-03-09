import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  ColumnAutoSizeModule,
  TextEditorModule,
  ValidationModule,
  RowApiModule,
} from 'ag-grid-community';
import { App } from './app/app';
import { appConfig } from './app/app.config';

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  ColumnAutoSizeModule,
  TextEditorModule,
  ValidationModule,
  RowApiModule,
]);
registerLocaleData(localeDe);

bootstrapApplication(App, appConfig)
  .then(() => console.log('%c🚀 Made by atra.consulting', 'color: #264892; font-size: 14px; font-weight: bold;'))
  .catch((err) => console.error(err));
