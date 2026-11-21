import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import Button from '@/components/common/Button';
import ErrorAlert from '@/components/common/ErrorAlert';
import Input from '@/components/common/Input';
import { loginSchema, type LoginFormValues } from '@/schemas/validation';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const toast = useToast();

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values.email, values.password);
      toast.success('Вхід виконано успішно');
      navigate(from, { replace: true });
    } catch {
      // Помилка вже збережена в authStore
    }
  };

  return (
    <div className="mx-auto my-10 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
          <LogIn className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Вхід у систему</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Авторизуйтесь для доступу до панелі керування
          </p>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={clearError} className="mb-5" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Електронна пошта"
          type="email"
          placeholder="user@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Пароль"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Увійти
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        Ще не маєте облікового запису?{' '}
        <Link
          to="/register"
          onClick={clearError}
          className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
        >
          Зареєструватися
        </Link>
      </p>
    </div>
  );
}