#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface SuperpoweredPolishBridge : NSObject

+ (BOOL)initializeWithLicenseKey:(NSString *)licenseKey error:(NSError *_Nullable *_Nullable)error;

+ (NSString *_Nullable)processFileAtPath:(NSString *)inputPath
                          outputWavPath:(NSString *)outputWavPath
                                 preset:(NSString *)preset
                                  error:(NSError *_Nullable *_Nullable)error;

/** Phase 2: decode → PCM passthrough → WAV (no polish). */
+ (NSString *_Nullable)spectralCleanFileAtPath:(NSString *)inputPath
                                outputWavPath:(NSString *)outputWavPath
                                        error:(NSError *_Nullable *_Nullable)error;

/** Editor effects: reverb / echo / modulate / enhance → WAV. */
+ (NSString *_Nullable)processEffectsFileAtPath:(NSString *)inputPath
                                 outputWavPath:(NSString *)outputWavPath
                                   effectsJson:(NSString *)effectsJson
                                         error:(NSError *_Nullable *_Nullable)error;

@end

NS_ASSUME_NONNULL_END
