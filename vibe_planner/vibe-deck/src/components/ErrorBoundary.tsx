'use client';
import React from 'react';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  
  componentDidCatch(error: Error) {
    console.error('Boundary error', error);
  }
  
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 text-red-600">
          Something went wrong. Please refresh.{' '}
          <pre className="mt-2 text-xs whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
