import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from './button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className='flex h-full flex-col items-center justify-center gap-4 p-8 text-center'>
          <AlertTriangle className='h-12 w-12 text-destructive' />
          <div className='space-y-2'>
            <h2 className='text-lg font-semibold'>页面出现错误</h2>
            <p className='max-w-md text-sm text-muted-foreground'>
              {this.state.error?.message || '发生了未知错误'}
            </p>
          </div>
          <Button onClick={this.handleReset} variant='outline' className='gap-2'>
            <RotateCcw className='h-4 w-4' />
            重试
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
