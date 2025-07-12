import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService } from '../supabase-client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"

const formSchema = z.object({
    email: z.string().email('Invalid email address'),
})

export function ResetPassword() {
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
        },
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setError(null)
            const { error } = await authService.resetPasswordForEmail(values.email)
            if (error) throw error
            setIsSubmitted(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        }
    }

    if (isSubmitted) {
        return (
            <div className="max-w-md mx-auto mt-8 p-6 bg-gray-800 rounded-lg">
                <Alert>
                    <AlertDescription>
                        Check your email for the password reset link.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-gray-800 rounded-lg">
            <h1 className="text-2xl font-bold text-white mb-6">Reset Password</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Email</FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        className="bg-gray-700 text-white border-gray-600"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Button type="submit" className="w-full" variant="secondary">
                        Send Reset Link
                    </Button>
                </form>
            </Form>
        </div>
    )
}