import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
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
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export function UpdatePassword() {
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [isRecovery] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: '',
            confirmPassword: ''
        },
    })

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setLoading(false)
            } else if (!session) {
                navigate('/sign-in', { replace: true })
            }
        })

        // Check initial session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                navigate('/sign-in', { replace: true })
            }
            setLoading(false)
        }
        
        checkSession()

        return () => {
            subscription.unsubscribe()
        }
    }, [navigate])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setError(null)
            const { error } = await authService.updatePassword(values.password)
            if (error) throw error

            // Optional: sign the user out to force re-login
            await supabase.auth.signOut()

            navigate('/sign-in', {
                replace: true,
                state: { message: 'Password updated successfully. Please log in with your new password.' }
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update password')
        }
    }

    if (loading) {
        return <p className="text-white text-center mt-10">Loading...</p>
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto mt-8 p-6 bg-gray-800 rounded-lg">
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    if (!isRecovery) return null

    return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-gray-800 rounded-lg">
            <h1 className="text-2xl font-bold text-white mb-6">Set New Password</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">New Password</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        className="bg-gray-700 text-white border-gray-600"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Confirm Password</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
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
                        Update Password
                    </Button>
                </form>
            </Form>
        </div>
    )
}
