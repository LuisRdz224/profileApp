import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { Amplify } from 'aws-amplify';
import amplify from './aws-exports'

// const amplify = require('./aws-exports').default;
Amplify.configure(amplify)

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
