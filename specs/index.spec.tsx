import React from 'react';
import { render } from '@testing-library/react';
import { AuthProvider } from '../src/lib/auth';
import { ToastProvider } from '../src/lib/toast';
import Page from '../src/app/page';

describe('Page', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <AuthProvider>
        <ToastProvider>
          <Page />
        </ToastProvider>
      </AuthProvider>,
    );
    expect(baseElement).toBeTruthy();
  });
});
