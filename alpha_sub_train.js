/*
 * Alpha Sub Train Widget v2.0.2
 * - HarrisHeller (@HarrisHeller)
 * - SamWoodhall (@SamCWoodhall)
 * - thefyrewire (@MikeyHay)
 */

const prefs = {};
let trainTimeout, trainTimeoutLock, trainAmount = 0,
    trainLocked = false,
    sane = false,
    trainLine, trainStation, trainRunning = false,
    gifts = 0,
    totalGifts = 0,
    trainVariant = 'Start';

window.addEventListener('onWidgetLoad', obj => {
    const fields = obj.detail.fieldData;
    if (fields.trainTime < 0) return;
    prefs.trainTime = fields.trainTime;
    prefs.trainTheme = fields.trainTheme;
    prefs.trainType = fields.trainType;
    prefs.trainOrientation = (fields.trainOrientation === 'horizontal') ? 'left' : 'top';
    prefs.trainDirection = fields.trainDirection;
    prefs.trainWidth = (fields.trainWidth > 0) ? fields.trainWidth : 0;
    prefs.trainGiftTriggers = fields.trainGiftTriggers;
    prefs.trainTipLocale = fields.trainTipLocale;
    prefs.trainTipCurrency = (fields.trainTipCurrency.trim().length > 0) ? fields.trainTipCurrency.trim() : 'USD';
    prefs.trainCheerShinyMinimum = (fields.trainCheerShinyMinimum > 0) ? fields.trainCheerShinyMinimum : 1;
    prefs.lineThickness = (fields.lineThickness > 0) ? fields.lineThickness : 0;
    prefs.spriteStartSize = (fields.spriteStartSize >= 0) ? fields.spriteStartSize : 25;
    prefs.spriteGiftSize = prefs.spriteStartSize;
    prefs.spriteShinySize = (fields.spriteShinySize >= 0) ? fields.spriteShinySize : 25;
    prefs.spriteEndDuration = (fields.spriteEndDuration >= 0) ? fields.spriteEndDuration : 1e3;

    const textTrain = '<div class="text-train-container"><span class="text-train"></span></div>';
    const textTrainIcon = '<span class="text-train-icon"></span>';
    $('.container').append('<div class="container-train"></div>');

    switch (prefs.trainOrientation) {
        case 'left':
            $('.container, .container-train').css('flex-direction', 'row');
            $('.container-train').css('width', `${prefs.trainWidth}%`);
            break;
        case 'top':
            $('.container, .container-train').css('flex-direction', 'column');
            $('.container-train').css('height', `${prefs.trainWidth}%`);
            break;
    }

    switch (prefs.trainDirection) {
        case 'left':
            $('.container').prepend(textTrain);
            $('.text-train-container').css('justify-content', prefs.trainOrientation === 'left' ? 'flex-end' : 'center');
            break;
        case 'right':
            $('.container').append(textTrain);
            $('.text-train-container').css('justify-content', prefs.trainOrientation === 'left' ? 'flex-start' : 'center');
            break;
    }
    $('.text-train-container').width((prefs.trainType === 'cheer-latest' && prefs.trainDirection === 'left') ? '120px' : '80px');

    if (fields.iconEnabled === 'yes') {
        switch (fields.iconSide) {
            case 'left':
                $('.text-train-container').css('flex-direction', 'row').prepend(textTrainIcon);
                break;
            case 'right':
                $('.text-train-container').css('flex-direction', 'row').append(textTrainIcon);
                break;
            case 'top':
                $('.text-train-container').css('flex-direction', 'column').prepend(textTrainIcon);
                break;
            case 'bottom':
                $('.text-train-container').css('flex-direction', 'column').append(textTrainIcon);
                break;
        }

        switch (prefs.trainType) {
            case 'subscriber-latest':
            case 'sponsor-latest':
                prefs.trainIcon = 'F';
                break;
            case 'cheer-latest':
                prefs.trainIcon = 'A';
                $('.text-train-container').width(prefs.trainDirection === 'left' ? '120px' : '80px');
                break;
            case 'follower-latest':
            case 'subscriber-latest-yt':
                prefs.trainIcon = 'S';
                break;
            case 'tip-latest':
            case 'tip-latest-yt':
            case 'superchat-latest':
                prefs.trainIcon = 'G';
                $('.text-train-container').width(prefs.trainDirection === 'left' ? '150px' : '80px');
                break;
        }
    }

    if (fields.trainMode.includes('preview')) {
        switch (prefs.trainType) {
            case 'follower-latest':
            case 'subscriber-latest':
            case 'subscriber-latest-yt':
            case 'sponsor-latest':
                prefs.testAmount = `${(Math.floor(Math.random()*(20-1+1))+1)}`;
                break;
            case 'cheer-latest':
                const cheers = ['5', '10', '100', '2000'];
                prefs.testAmount = cheers[Math.floor(Math.random() * cheers.length)];
                break;
            case 'tip-latest':
            case 'tip-latest-yt':
            case 'superchat-latest':
                prefs.testAmount = sellEverythingAtPokemart((Math.random() * (20 - 1 + 1)) + 1);
                break;
        }
        $('.text-train').text(prefs.testAmount);
        $('.text-train-icon').text(prefs.trainIcon);
        $('.text-train-container').css('visibility', 'visible');
    }

    if (prefs.trainTheme === 'sprites') {
        if (
          (!fields.spriteEndImage && !fields.spriteEndVideo)
          || (!fields.spriteStartImage && !fields.spriteStartVideo)
        ) {
          	return;
        }
      
        if (fields.spriteEndImage && fields.spriteEndImage.length !== 0) {
          	prefs.spriteEnd = {
            	'src': fields.spriteEndImage,
            	'type': 'img'
          	}
            prefs.spriteEndImageStill = {
                'src': fields.spriteEndImageStill,
                'type': 'img'
            }
        } else if (fields.spriteEndVideo && fields.spriteEndVideo.length !== 0) {
          	prefs.spriteEnd = {
            	'src': fields.spriteEndVideo,
            	'type': 'video'
          	}
        } else {
          	return;
        }
      
        if (fields.spriteStartImage && fields.spriteStartImage.length !== 0) {
            prefs.spriteStart = {
                'src': fields.spriteStartImage,
                'type': 'img'
          	}
        } else if (fields.spriteStartVideo && fields.spriteStartVideo.length !== 0) {
            prefs.spriteStart = {
                'src': fields.spriteStartVideo,
                'type': 'video'
            }
        } else {
          	return;
        }
      
      	if (fields.spriteGiftImage && fields.spriteGiftImage.length !== 0) {
        	prefs.spriteGift = {
                'src': fields.spriteGiftImage,
                'type': 'img'
            }
        } else if (fields.spriteGiftVideo && fields.spriteGiftVideo.length !== 0) {
            prefs.spriteGift = {
                'src': fields.spriteGiftVideo,
                'type': 'video'
            }
        } else {
            prefs.spriteGift = prefs.spriteStart;
        }
      
        prefs.spriteShinyChance = fields.spriteShinyChance;
        if (prefs.spriteShinyChance > 0) {
            if (fields.spriteShinyImage && fields.spriteShinyImage.length !== 0) {
              	prefs.spriteShiny = {
                	'src': fields.spriteShinyImage,
                	'type': 'img'
            	}
            } else if (fields.spriteShinyVideo && fields.spriteShinyVideo.length !== 0) {
                prefs.spriteShiny = {
            		'src': fields.spriteShinyVideo,
                  	'type': 'video'
              	}
            } else {
              	return;
            }
        }
        
        const char = wondertradePokemon(prefs.spriteStart);

        let spriteEndToDisplay = prefs.spriteEnd;
        if ('spriteEndImageStill' in prefs) {
            spriteEndToDisplay = prefs.spriteEndImageStill;
        }
        
        const end = document.createElement(spriteEndToDisplay.type);
        end.src = spriteEndToDisplay.src;
        end.classList = ['sprite end'];
        end.style[prefs.trainOrientation] = (prefs.trainDirection === 'left') ? '0' : 'calc(100% - calc({{spriteStartSize}}px + {{spriteEndSize}}px))';

        $('.container-train').append(prefs.trainDirection === 'left' ? [end, char] : [char, end]);

        if (fields.trainMode === 'previewshiny' && prefs.spriteShiny) {
            trainVariant = 'Shiny';
            $('.char').remove();
            const char = wondertradePokemon(prefs.spriteShiny);
            if (prefs.trainDirection === 'left') $('.container-train').append(char);
            else $('.container-train').prepend(char);
        }
        if (fields.trainMode.includes('preview')) {
            $('.sprite').css('display', 'inline-flex');
            if ((prefs.spriteStart.type === 'video' && fields.trainMode === 'preview') || (prefs.spriteShiny && prefs.spriteShiny.type === 'video' && fields.trainMode === 'previewshiny')) $('.char')[0].play();
            return;
        }

    } else {
        $('.container-train').append('<div class="line"></div><div class="line-bg"></div>');
        switch (prefs.trainOrientation) {
            case 'left':
                $('.line, .line-bg').css('width', '100%').css('height', `${prefs.lineThickness}px`);
                prefs.lineScale = 'scaleX';
                break;
            case 'top':
                $('.line, .line-bg').css('height', '100%').css('width', `${prefs.lineThickness}px`);
                prefs.lineScale = 'scaleY';
                break;
        }

        switch (fields.lineStyle) {
            case 'single':
                $('.line').css('background-color', '{{lineColor}}');
                break;
            case 'gradient':
            case 'custom':
                const colors = (fields.lineStyle === 'gradient') ? '{{lineColor}} 0%, {{lineColor2}} 100%' : '{{lineGradientCustom}}';
                switch (prefs.trainOrientation) {
                    case 'left':
                        $('.line').css('background', `linear-gradient(to ${(fields.lineGradientDirection === 'lengthways') ? 'right' : 'bottom'}, ${colors})`);
                        break;
                    case 'top':
                        $('.line').css('background', `linear-gradient(to ${(fields.lineGradientDirection === 'lengthways') ? 'bottom' : 'right'}, ${colors})`);
                        break;
                }
                break;
        }

        battleTheEliteFour(100, 0);
        $('.line, .line-bg').css('clip-path', prefs.trainClipEnd);

        if (fields.trainMode.includes('preview')) {
            battleTheEliteFour(fields.lineStyle === 'single' ? 70 : 100, 100);
            $('.line').css('clip-path', prefs.trainClipStart);
            $('.line-bg').css('clip-path', prefs.trainClipEnd);
            return;
        }
    }

    sane = true;
});

window.addEventListener('onEventReceived', obj => {
    if (!sane || trainLocked) return;
    if (obj.detail.listener !== prefs.trainType.split('-').slice(0, 2).join('-')) {
        SE_API.resumeQueue();
        return;
    }
    const event = obj.detail.event;
    switch (prefs.trainType) {
        case 'subscriber-latest':
            if (event.bulkGifted && prefs.trainGiftTriggers === 'yes') {
                totalGifts = event.amount;
                SE_API.resumeQueue();
            } else if (event.gifted && event.isCommunityGift && prefs.trainGiftTriggers === 'yes') {
                gifts++;
                if (gifts === totalGifts) decideYourFate(totalGifts, 'Gift');
                else SE_API.resumeQueue();
            } else if (event.gifted && event.sender !== event.name && prefs.trainGiftTriggers === 'yes') {
                decideYourFate(1, 'Gift');
            } else if (!event.gifted && !event.bulkGifted) {
                decideYourFate(1);
            }
            break;
        case 'cheer-latest':
        case 'tip-latest':
        case 'tip-latest-yt':
        case 'superchat-latest':
            decideYourFate(event.amount);
            break;
        case 'follower-latest':
        case 'subscriber-latest-yt':
        case 'sponsor-latest':
            decideYourFate(1);
            break;
        default:
            SE_API.resumeQueue();
            return;
    }
});

const decideYourFate = (amount, eventType = 'Start') => {
    if (trainTimeout) forfeitAllMortalPossessions();
    trainAmount += amount;
    gifts = 0;
    totalGifts = 0;
    $('.text-train').text((prefs.trainType.split('-').slice(0, 2).join('-') === 'tip-latest' || prefs.trainType === 'superchat-latest') ? sellEverythingAtPokemart(trainAmount) : trainAmount);
    $('.text-train-icon').text(prefs.trainIcon);
    $('.text-train-container').css('visibility', 'visible').css('animation', 'bounceIn 0.5s forwards');

    switch (prefs.trainTheme) {
        case 'line':
            doTheLineDanceRoutine();
            break;
        case 'sprites':
            allAboardTheTrainChooChoo(amount, eventType);
            break;
    }
}

const doTheLineDanceRoutine = () => {
    if (trainTimeout) forfeitAllMortalPossessions();
    if (trainLine || trainStation) {
        trainLine.pause();
        trainLine = null;
        trainStation.pause();
        trainStation = null;
    }
    trainStation = anime({
        targets: `.line${!trainRunning ? ', .line-bg' : ''}`,
        'clip-path': prefs.trainClipStart,
        duration: 1e3,
        easing: 'easeInOutQuart'
    });

    setTimeout(() => {
        trainRunning = true;
        trainLine = anime({
            targets: '.line',
            'clip-path': prefs.trainClipEnd,
            duration: prefs.trainTime * 1e3,
            easing: 'linear'
        });
        trainTimeout = setTimeout(() => {
            trainLocked = true;
            trainAmount = 0;
            anime({
                targets: '.line-bg',
                'clip-path': prefs.trainClipEnd,
                duration: 1e3,
                easing: 'easeInOutQuart'
            });
            setTimeout(() => {
                $('.text-train-container').css('animation', 'bounceOut 0.5s forwards');
                setTimeout(() => $('.text-train-container').css('visibility', 'hidden'), 500);
                trainRunning = false;
                forfeitAllMortalPossessions();
            }, 1e3);
        }, prefs.trainTime * 1e3);
    }, 1e3);
}

const allAboardTheTrainChooChoo = (amount, eventType) => {
    if (trainTimeout) forfeitAllMortalPossessions();
    if (trainLine || trainStation) {
        clearTimeout(trainLine);
        trainLine = null;
        clearTimeout(trainStation);
        trainStation = null;
    }

    let professorOak;

    if (trainRunning) {
        $('.char').css('animation', 'fadeOut 0.7s forwards');
        trainStation = setTimeout(() => {
            globalTradeStation(amount, eventType);
            professorOak = `calc(100% - calc(${prefs[`sprite${trainVariant}Size`]}px + {{spriteEndSize}}px))`;
            $('.char').css('transition', 'none').css('display', 'inline-flex').css(prefs.trainOrientation, (prefs.trainDirection === 'left') ? professorOak : '0')
                .css('animation', 'fadeIn 0.7s forwards');
            if (prefs[`sprite${trainVariant}`].type === 'video') {
                $('.char')[0].pause();
                $('.char')[0].currentTime = 0;
            }
        }, 300);
    } else {
        globalTradeStation(amount, eventType);
        professorOak = `calc(100% - calc(${prefs[`sprite${trainVariant}Size`]}px + {{spriteEndSize}}px))`;
        $('.sprite').css('display', 'inline-flex').css('animation', 'fadeIn 0.7s forwards');
    }

    trainLine = setTimeout(() => {
        trainRunning = true;
        $('.char').css('transition', '{{trainTime}}s linear').css(prefs.trainOrientation, (prefs.trainDirection === 'left') ? '0' : professorOak);
        if (prefs[`sprite${trainVariant}`].type === 'video') $('.char')[0].play();
        SE_API.resumeQueue();
        trainTimeout = setTimeout(() => {
            trainLocked = true;
            if (prefs[`sprite${trainVariant}`].type === 'video') $('.char')[0].pause();
            if (prefs.spriteEnd.type === 'video') $('.end')[0].play();

            if (prefs.spriteEnd.type === 'img') {
                $('.end').attr('src', prefs.spriteEnd.src);
            }

            $('.char').css('animation', 'bounceOut 0.5s forwards');
            setTimeout(() => {
                $('.end').css('animation', 'bounceOut 0.5s forwards');
                setTimeout(() => {
                    trainAmount = 0;
                    $('.text-train-container').css('animation', 'bounceOut 0.5s forwards');
                    setTimeout(() => $('.text-train-container').css('visibility', 'hidden'), 500);
                    $('.sprite').css('display', 'none');
                    $('.char').css('transition', 'none').css(prefs.trainOrientation, (prefs.trainDirection === 'left') ? professorOak : '0');
                    if (prefs.spriteEnd.type === 'video') $('.end')[0].currentTime = 0;
                    trainRunning = false;
                    forfeitAllMortalPossessions();
                }, 500);
            }, prefs.spriteEndDuration);
        }, prefs.trainTime * 1e3);

        trainTimeoutLock = setTimeout(() => {
            trainLocked = true;
        }, (prefs.trainTime - 1) * 1e3);
    }, 1e3);
}

const wondertradePokemon = (sprite) => {
    const char = document.createElement(sprite.type);
    char.src = sprite.src;
    char.classList = [`sprite char ${trainVariant === 'Shiny' ? 'shiny' : 'start'}`];
    char.style[prefs.trainOrientation] = (prefs.trainDirection === 'left') ? `calc(100% - calc(${prefs[`sprite${trainVariant}Size`]}px + {{spriteEndSize}}px))` : '0';
    if (sprite.type === 'video') char.loop = true;
    return char;
}

const globalTradeStation = (amount, eventType) => {
    let variant;
    if (amount < prefs.trainCheerShinyMinimum && prefs.trainType === 'cheer-latest') {
        variant = eventType;
    } else {
        variant = (Math.floor(Math.random() * 100) + 1) <= prefs.spriteShinyChance ? 'Shiny' : eventType;
    }

    if (trainVariant === variant) {
        return;
    }

    trainVariant = variant;
    $('.char').remove();
    const char = wondertradePokemon(prefs[`sprite${variant}`]);
    if (prefs.trainDirection === 'left') {
        $('.container-train').append(char);
    } else {
        $('.container-train').prepend(char);
    }
}


const sellEverythingAtPokemart = (amount) => {
    try {
        const c = amount.toLocaleString(prefs.trainTipLocale, {
            style: 'currency',
            currency: prefs.trainTipCurrency,
            minimumFractionDigits: 2
        });
        return c.substr(-3) === '.00' ? c.substr(0, c.length - 3) : c;
    } catch (e) {
        return amount;
    }
}

const battleTheEliteFour = (start, end) => {
    start = 100 - start;
    end = 100 - end;
    if (prefs.trainOrientation === 'left' && prefs.trainDirection === 'left') {
        prefs.trainClipStart = `inset(0px ${start}% 0px 0px)`;
        prefs.trainClipEnd = `inset(0px ${end}% 0px 0px)`;
    } else if (prefs.trainOrientation === 'left' && prefs.trainDirection === 'right') {
        prefs.trainClipStart = `inset(0px 0px 0px ${start}%)`;
        prefs.trainClipEnd = `inset(0px 0px 0px ${end}%)`;
    } else if (prefs.trainOrientation === 'top' && prefs.trainDirection === 'left') {
        prefs.trainClipStart = `inset(0px 0px ${start}% 0px)`;
        prefs.trainClipEnd = `inset(0px 0px ${end}% 0px)`;
    } else if (prefs.trainOrientation === 'top' && prefs.trainDirection === 'right') {
        prefs.trainClipStart = `inset(${start}% 0px 0px 0px)`;
        prefs.trainClipEnd = `inset(${end}% 0px 0px 0px)`;
    }
}

const forfeitAllMortalPossessions = () => {
    clearTimeout(trainTimeout);
    trainTimeout = null;
    clearTimeout(trainTimeoutLock);
    trainTimeoutLock = null;
    trainLocked = false;

    if ('spriteEndImageStill' in prefs) {
        $('.end').attr('src', prefs.spriteEndImageStill.src);
    }
}

const capitalizeFirstLetter = (str) => {
    return str[0].toUpperCase() + str.slice(1);
}