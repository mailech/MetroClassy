import React from 'react';

const SkeletonElement = ({ type }) => {
  const classes = `skeleton ${type}`;
  return <div className={classes}></div>;
};

export const ProductCardSkeleton = ({ count = 1 }) => {
  return Array(count)
    .fill(0)
    .map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="bg-gray-200 rounded-lg overflow-hidden h-48"></div>
        <div className="mt-3 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    ));
};

export const ProductDetailsSkeleton = () => (
  <div className="animate-pulse">
    <div className="lg:grid lg:grid-cols-2 lg:gap-12">
      <div>
        <div className="bg-gray-200 rounded-lg h-96"></div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
          ))}
        </div>
      </div>
      <div className="mt-10 lg:mt-0 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-12 bg-gray-200 rounded w-1/3"></div>
        
        <div className="pt-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-10 bg-gray-200 rounded-md"></div>
            ))}
          </div>
        </div>
        
        <div className="pt-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="flex space-x-2">
            {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
              <div key={size} className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-6">
          <div className="h-12 bg-gray-200 rounded-md w-full"></div>
        </div>
      </div>
    </div>
  </div>
);

export const CartItemSkeleton = ({ count = 1 }) => {
  return Array(count)
    .fill(0)
    .map((_, index) => (
      <div key={index} className="flex py-6 animate-pulse">
        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-200"></div>
        <div className="ml-4 flex flex-1 flex-col">
          <div>
            <div className="flex justify-between text-base font-medium text-gray-900">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="mt-1 h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="flex flex-1 items-end justify-between text-sm">
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
            <div className="flex">
              <div className="h-5 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    ));
};

export default SkeletonElement;
