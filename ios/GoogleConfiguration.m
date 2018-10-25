//
//  GoogleConfiguration.m
//  RNSpokestack
//
//  Created by Noel Weichbrodt on 11/1/18.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "GoogleConfiguration.h"

@implementation GoogleConfiguration 

-(NSString *) host
{
    return @"speech.googleapis.com";
}

-(NSString *) apiKey
{
    return @"";
}

-(Boolean) enableWordTimeOffsest
{
    return true;
}

-(NSInteger) maxAlternatives
{
    return 1;
}

-(Boolean) singleUtterance
{
    return true;
}

-(Boolean) interimResults
{
    return false;
}

@end
