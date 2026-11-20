import { Component, type ErrorInfo, type ReactNode } from 'react';
import Button from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Помилка відтворення компонента:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          className="mx-auto my-12 max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30"
        >
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
            Щось пішло не так
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {this.state.errorMessage || 'Виникла непередбачена помилка інтерфейсу.'}
          </p>
          <div className="mt-4">
            <Button variant="danger" size="sm" onClick={this.handleReset}>
              Спробувати ще раз
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}