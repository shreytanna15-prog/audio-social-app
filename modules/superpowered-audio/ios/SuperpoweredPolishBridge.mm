#import "SuperpoweredPolishBridge.h"

#include "SpectralClean.h"
#include "SuperpoweredEffects.h"
#include "SuperpoweredPolish.h"

@implementation SuperpoweredPolishBridge

+ (BOOL)initializeWithLicenseKey:(NSString *)licenseKey error:(NSError **)error {
  if (licenseKey.length == 0) {
    if (error) {
      *error = [NSError errorWithDomain:@"SuperpoweredAudio"
                                   code:1
                               userInfo:@{NSLocalizedDescriptionKey: @"Superpowered license key is empty."}];
    }
    return NO;
  }

  const int ok = SuperpoweredPolish_initialize([licenseKey UTF8String]);
  if (!ok) {
    if (error) {
      const char *message = SuperpoweredPolish_lastError();
      *error = [NSError errorWithDomain:@"SuperpoweredAudio"
                                   code:2
                               userInfo:@{
                                 NSLocalizedDescriptionKey: message
                                   ? [NSString stringWithUTF8String:message]
                                   : @"Superpowered initialize failed."
                               }];
    }
    return NO;
  }

  return YES;
}

+ (NSString *)processFileAtPath:(NSString *)inputPath
                 outputWavPath:(NSString *)outputWavPath
                        preset:(NSString *)preset
                         error:(NSError **)error {
  NSString *input = inputPath;
  if ([input hasPrefix:@"file://"]) {
    input = [input substringFromIndex:7];
  }

  NSString *output = outputWavPath;
  if ([output hasPrefix:@"file://"]) {
    output = [output substringFromIndex:7];
  }

  NSString *resolvedPreset = preset.length > 0 ? preset : @"speech-polish";
  const int code = SuperpoweredPolish_processFile(
    [input UTF8String],
    [output UTF8String],
    [resolvedPreset UTF8String]
  );

  if (code != 0) {
    if (error) {
      const char *message = SuperpoweredPolish_lastError();
      *error = [NSError errorWithDomain:@"SuperpoweredAudio"
                                   code:code
                               userInfo:@{
                                 NSLocalizedDescriptionKey: message
                                   ? [NSString stringWithUTF8String:message]
                                   : @"Superpowered polish failed."
                               }];
    }
    return nil;
  }

  return [NSString stringWithFormat:@"superpowered-%@", resolvedPreset];
}

+ (NSString *)spectralCleanFileAtPath:(NSString *)inputPath
                       outputWavPath:(NSString *)outputWavPath
                           intensity:(NSString *)intensity
                               error:(NSError **)error {
  NSString *input = inputPath;
  if ([input hasPrefix:@"file://"]) {
    input = [input substringFromIndex:7];
  }

  NSString *output = outputWavPath;
  if ([output hasPrefix:@"file://"]) {
    output = [output substringFromIndex:7];
  }

  NSString *resolvedIntensity =
    intensity.length > 0 ? intensity : @"current";

  const int code = SpectralClean_processFile(
    [input UTF8String],
    [output UTF8String],
    [resolvedIntensity UTF8String]
  );
  if (code != 0) {
    if (error) {
      const char *message = SpectralClean_lastError();
      *error = [NSError errorWithDomain:@"SuperpoweredAudio"
                                   code:code
                               userInfo:@{
                                 NSLocalizedDescriptionKey: message
                                   ? [NSString stringWithUTF8String:message]
                                   : @"Spectral clean failed."
                               }];
    }
    return nil;
  }

  const char *stats = SpectralClean_lastStats();
  if (stats != nullptr && stats[0] != '\0') {
    return [NSString stringWithUTF8String:stats];
  }
  return @"strategy=interference-soften";
}

+ (NSString *)processEffectsFileAtPath:(NSString *)inputPath
                        outputWavPath:(NSString *)outputWavPath
                          effectsJson:(NSString *)effectsJson
                                error:(NSError **)error {
  NSString *input = inputPath;
  if ([input hasPrefix:@"file://"]) {
    input = [input substringFromIndex:7];
  }

  NSString *output = outputWavPath;
  if ([output hasPrefix:@"file://"]) {
    output = [output substringFromIndex:7];
  }

  NSString *json = effectsJson.length > 0 ? effectsJson : @"[]";
  const int code = SuperpoweredEffects_processFile(
    [input UTF8String],
    [output UTF8String],
    [json UTF8String]
  );

  if (code != 0) {
    if (error) {
      const char *message = SuperpoweredEffects_lastError();
      *error = [NSError errorWithDomain:@"SuperpoweredAudio"
                                   code:code
                               userInfo:@{
                                 NSLocalizedDescriptionKey: message
                                   ? [NSString stringWithUTF8String:message]
                                   : @"Superpowered effects failed."
                               }];
    }
    return nil;
  }

  return @"superpowered-effects";
}

@end
