'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Check, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Pricing() {
  const { status, session, subscriptionPlan } = useAuth();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>(
    'monthly'
  );

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Basic features for casual users',
      price: { monthly: 0, yearly: 0 },
      features: [
        '5 video chats per month',
        'Basic AI responses',
        'Standard processing speed',
        'No chat history',
      ],
      buttonText: 'Current Plan',
      highlight: false,
      disabled: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Everything you need for regular use',
      price: { monthly: 9.99, yearly: 99.99 },
      features: [
        '50 video chats per month',
        'Enhanced AI responses',
        'Faster processing speed',
        'Save and access chat history',
        'Priority support',
      ],
      buttonText: 'Upgrade to Pro',
      highlight: true,
      disabled: false,
    },
    {
      id: 'max',
      name: 'Max',
      description: 'For power users and creators',
      price: { monthly: 19.99, yearly: 199.99 },
      features: [
        'Unlimited video chats',
        'Highest quality AI responses',
        'Fastest processing speed',
        'Advanced social media content generation',
        'API access',
        '24/7 priority support',
      ],
      buttonText: 'Upgrade to Max',
      highlight: false,
      disabled: false,
    },
  ];

  return (
    <>
      <Header />
      <div className='flex flex-col min-h-screen bg-dark-500 py-16 px-4'>
        <div className='max-w-6xl mx-auto w-full'>
          <div className='text-center mb-12'>
            <h1 className='text-4xl font-bold mb-4 text-white'>
              Choose Your Plan
            </h1>
            <p className='text-xl text-gray-300 max-w-2xl mx-auto'>
              Get more out of our AI with premium features and higher usage
              limits
            </p>

            {/* Billing interval toggle */}
            <div className='flex items-center justify-center mt-8 space-x-4'>
              <div
                className={`cursor-pointer py-2 px-4 rounded-lg transition-colors ${
                  billingInterval === 'monthly'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-300 text-gray-300'
                }`}
                onClick={() => setBillingInterval('monthly')}
              >
                Monthly
              </div>
              <div
                className={`cursor-pointer py-2 px-4 rounded-lg transition-colors flex items-center gap-2 ${
                  billingInterval === 'yearly'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-300 text-gray-300'
                }`}
                onClick={() => setBillingInterval('yearly')}
              >
                Yearly
                <span className='bg-primary-700 text-white text-xs px-2 py-1 rounded-full'>
                  Save 16%
                </span>
              </div>
            </div>
          </div>

          <div className='grid md:grid-cols-3 gap-8'>
            {plans.map((plan) => {
              const isCurrentPlan =
                status === 'authenticated' &&
                subscriptionPlan === plan.name.toUpperCase();

              return (
                <div
                  key={plan.id}
                  id={plan.id}
                  className={`bg-dark-300 rounded-lg overflow-hidden border transition-all ${
                    plan.highlight
                      ? 'border-primary-500 shadow-lg shadow-primary-500/10'
                      : 'border-dark-200 hover:border-primary-500/50'
                  }`}
                >
                  {plan.highlight && (
                    <div className='bg-primary-500 text-white text-center py-1 text-sm font-medium'>
                      Most Popular
                    </div>
                  )}

                  <div className='p-6'>
                    <h2 className='text-2xl font-bold text-white mb-1'>
                      {plan.name}
                    </h2>
                    <p className='text-gray-400 mb-4'>{plan.description}</p>

                    <div className='mb-6'>
                      <span className='text-4xl font-bold text-white'>
                        ${plan.price[billingInterval].toFixed(2)}
                      </span>
                      {plan.price[billingInterval] > 0 && (
                        <span className='text-gray-400 ml-1'>
                          /{billingInterval === 'monthly' ? 'month' : 'year'}
                        </span>
                      )}
                    </div>

                    <ul className='space-y-3 mb-6'>
                      {plan.features.map((feature, index) => (
                        <li key={index} className='flex items-start gap-2'>
                          <Check
                            size={20}
                            className='text-primary-300 flex-shrink-0 mt-0.5'
                          />
                          <span className='text-gray-300'>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`w-full py-2 px-4 rounded-md text-center transition-colors ${
                        isCurrentPlan
                          ? 'bg-primary-500/20 text-primary-300 border border-primary-500/50 cursor-default'
                          : plan.highlight
                          ? 'bg-primary-500 hover:bg-primary-600 text-white'
                          : 'bg-dark-200 hover:bg-dark-100 text-white border border-primary-500/30'
                      }`}
                      disabled={isCurrentPlan || plan.disabled}
                    >
                      {isCurrentPlan ? 'Current Plan' : plan.buttonText}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className='mt-12 bg-dark-300 p-6 rounded-lg border border-primary-500/20 max-w-3xl mx-auto'>
            <div className='flex items-start gap-4'>
              <div className='bg-primary-500/20 p-3 rounded-full'>
                <Zap size={24} className='text-primary-300' />
              </div>
              <div>
                <h3 className='text-xl font-bold text-white mb-2'>
                  Enterprise Solutions
                </h3>
                <p className='text-gray-300 mb-4'>
                  Need a custom solution for your organization? Contact us for
                  custom pricing, dedicated support, and enterprise features.
                </p>
                <a
                  href='mailto:enterprise@youchat.com'
                  className='text-primary-300 hover:underline'
                >
                  Contact Sales →
                </a>
              </div>
            </div>
          </div>

          <div className='mt-12 text-center'>
            <h3 className='text-xl font-bold text-white mb-4'>
              Frequently Asked Questions
            </h3>
            <div className='grid md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
              <div className='bg-dark-300 p-4 rounded-lg'>
                <h4 className='font-bold text-white mb-2'>
                  Can I change plans later?
                </h4>
                <p className='text-gray-300'>
                  Yes, you can upgrade or downgrade your plan at any time.
                  Changes take effect at the end of your billing cycle.
                </p>
              </div>
              <div className='bg-dark-300 p-4 rounded-lg'>
                <h4 className='font-bold text-white mb-2'>
                  How do I cancel my subscription?
                </h4>
                <p className='text-gray-300'>
                  You can cancel your subscription from your account settings.
                  You'll maintain access until the end of your billing period.
                </p>
              </div>
              <div className='bg-dark-300 p-4 rounded-lg'>
                <h4 className='font-bold text-white mb-2'>
                  Do you offer refunds?
                </h4>
                <p className='text-gray-300'>
                  We offer a 7-day money-back guarantee for all paid plans.
                  Contact support for assistance.
                </p>
              </div>
              <div className='bg-dark-300 p-4 rounded-lg'>
                <h4 className='font-bold text-white mb-2'>
                  What happens when I reach my usage limit?
                </h4>
                <p className='text-gray-300'>
                  You'll be prompted to upgrade to a higher plan. Free plan
                  users can wait until the next month for their limit to reset.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
