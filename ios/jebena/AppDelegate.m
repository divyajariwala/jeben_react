/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
@import Firebase;
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <OneSignal/OneSignal.h>
#import <React/RCTLinkingManager.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"jebena"
                                            initialProperties:nil];

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  [FIRApp configure];
  [[FBSDKApplicationDelegate sharedInstance] application:application
  didFinishLaunchingWithOptions:launchOptions];
  [OneSignal initWithLaunchOptions:launchOptions
   appId:@"f845f6e7-6087-49a2-af56-7556e3de3245"
   handleNotificationAction:nil
   settings:@{kOSSettingsKeyAutoPrompt: @false}];
  OneSignal.inFocusDisplayType = OSNotificationDisplayTypeNotification;

  // Recommend moving the below line to prompt for push after informing the user about
  // how your app will use them.
  [OneSignal promptForPushNotificationsWithUserResponse:^(BOOL accepted) {
    NSLog(@"User accepted notifications: %d", accepted);
  }];
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  
  return [[FBSDKApplicationDelegate sharedInstance] application:application openURL:url options:options];

//  NSString *myUrl = url.absoluteString;
//  NSLog(@"MY URL 😭: %@", myUrl);
//  if ([myUrl containsString:@"2723020171116592"]) {
//    return [[FBSDKApplicationDelegate sharedInstance] application:application openURL:url options:options];
//  } else {
//    return [RCTLinkingManager application:application openURL:url options:options];
//  }
}

@end
