import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Props;
  state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in React Tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    if (window.confirm('هل أنت تأكد من إعادة ضبط البيانات التخزينية لحل المشكلة؟ سيتم تنظيف التخزين المؤقت وإعادة تحميل التطبيق.')) {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error(e);
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-amber-50/50 flex items-center justify-center p-4 dir-rtl text-right font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-xl border border-amber-200/80 text-gray-800 space-y-4">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto text-amber-700 mb-2">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-bold text-center text-amber-950">
              تنبيه في تشغيل التطبيق
            </h2>

            <p className="text-sm text-gray-600 text-center leading-relaxed">
              حدث خطأ أثناء تحميل إحدى واجهات التطبيق. يمكنك إعادة تحميل الصفحة أو إعادة تعيين التخزين المؤقت.
            </p>

            {this.state.error && (
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-red-600 font-mono overflow-x-auto max-h-32 border border-gray-200 ltr text-left">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة تحميل الصفحة
              </button>

              <button
                onClick={this.handleResetStorage}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-all border border-gray-200"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                إعادة ضبط التخزين المحلي والتعافي
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
