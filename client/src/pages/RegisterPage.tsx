import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import Button from '@/components/common/Button';
import ErrorAlert from '@/components/common/ErrorAlert';
import Input from '@/components/common/Input';
import { registerSchema, type RegisterFormValues } from '@/schemas/validation';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await registerUser(values.name, values.email, values.password);
      if (useAuthStore.getState().isAuthenticated) {
        toast.success('Реєстрацію завершено! Ласкаво просимо.');
        navigate('/dashboard', { replace: true });
      } else {
        toast.success('Обліковий запис створено. Тепер увійдіть у систему.');
        navigate('/login', { replace: true });
      }
    } catch {
      // Помилка відображається через ErrorAlert
    }
  };

  return (
    <div className="mx-auto my-10 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Реєстрація</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Створіть обліковий запис у BookingSystem
          </p>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={clearError} className="mb-5" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Ім’я та прізвище"
          type="text"
          placeholder="Олександр Коваленко"
          error={errors.name?.message}
          {...register('name')}
        />

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
          placeholder="Мінімум 6 символів"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Підтвердження пароля"
          type="password"
          placeholder="Повторіть пароль"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Створити обліковий запис
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        Вже зареєстровані?{' '}
        <Link
          to="/login"
          onClick={clearError}
          className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
        >
          Увійти
        </Link>
      </p>
    </div>
  );
}