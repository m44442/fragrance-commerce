"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  showAll?: {
    href: string;
    text?: string;
  };
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  align?: 'left' | 'center' | 'right';
}

export function SectionHeader({
  title,
  subtitle,
  showAll,
  className,
  titleClassName,
  subtitleClassName,
  align = 'left',
}: SectionHeaderProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const justifyClasses = {
    left: 'justify-between',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div className={cn('mb-6 sm:mb-8', className)}>
      <div className={cn('flex items-center', justifyClasses[align])}>
        <div className={cn(alignClasses[align], align !== 'center' && 'flex-1')}>
          <h2 className={cn(
            'text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2',
            titleClassName
          )}>
            {title}
          </h2>
          {subtitle && (
            <p className={cn(
              'text-sm sm:text-base text-gray-600',
              subtitleClassName
            )}>
              {subtitle}
            </p>
          )}
        </div>

        {showAll && align !== 'center' && (
          <div className="flex-shrink-0">
            <Button variant="ghost" size="sm" asChild>
              <Link href={showAll.href} className="flex items-center space-x-1">
                <span>{showAll.text || 'すべて見る'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>

      {showAll && align === 'center' && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" asChild>
            <Link href={showAll.href} className="flex items-center space-x-1">
              <span>{showAll.text || 'すべて見る'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}