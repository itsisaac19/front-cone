import { $, component$, type NoSerialize, noSerialize, useSignal, useStore, useTask$, useVisibleTask$ } from '@builder.io/qwik';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// This import statement is just for type information
import type Paper from 'paper';

// Dummy variable for the global paper object
declare const paper: typeof Paper;

const writeVar = (label: string, val: any) => {
    const writeBox = document.querySelector('.write-box') as HTMLElement;
    const existing = writeBox.querySelector(`[var-label=${label}]`);
    if (existing) {
        (existing.querySelector('.val') as HTMLElement).innerHTML = val;
    } else {
        const varElement = Object.assign(document.createElement('div'), {
            className: 'var-wrap',
            innerHTML: `
                <div class="label">${label}:</div>
                <div class="val">${val}</div>
            `
        })
        varElement.setAttribute('var-label', label);

        writeBox.appendChild(varElement)
    }
} 

const clearVar = (labelArrayOrString: string | string[]) => {
    const writeBox = document.querySelector('.write-box') as HTMLElement;
    const labels = Array.isArray(labelArrayOrString) ? labelArrayOrString : [labelArrayOrString];

    for(const l of labels) {
        const existing = writeBox.querySelector(`[var-label=${l}]`);
        if (existing) {
            existing.remove();
        }
    }
}

interface SectorFieldProps {
    circle: paper.Path.Circle,
    sectorRadius: number,
    sectorAngle: number,
    group: paper.Group,
    offense: boolean,
    index: number,
}

const sectorArray: paper.Path.Arc[] = [];
const sectorIntersectionAreas: { [authorId: number]: { [id: number]: paper.PathItem | undefined } }= {};

const drawSectorFieldOnCircle = (props: SectorFieldProps) => {
    const { circle: playerCircle, sectorRadius, sectorAngle, group, offense, index } = props;

    const getZoom = () => paper.view.zoom;
    const areHandlersDisabled = () => document.body.classList.contains('disable-handlers');

    const center = playerCircle.bounds.center;
    const radius = playerCircle.bounds.height || playerCircle.bounds.width;

    // Define the angle range of the FOV sector
    // May have to refactor to scale later
    const startAngle = 90 - (sectorAngle / 2);  // Always positive
    const endAngle = 90 + (sectorAngle / 2);   // Always > start angle

    const midpointAngle = (endAngle + startAngle) / 2; // Midpoint / Direction of hips

    console.log({midpointAngle})

    // Calculate the start, through, and end points of the arc
    const start = new paper.Point(
        center.x + (radius + sectorRadius) * Math.cos(startAngle * (Math.PI / 180)),
        center.y + (radius + sectorRadius) * -Math.sin(startAngle * (Math.PI / 180))
    );

    const through = new paper.Point(
        center.x + (radius + sectorRadius) * Math.cos(midpointAngle * (Math.PI / 180)),
        center.y + (radius + sectorRadius) * -Math.sin(midpointAngle * (Math.PI / 180))
    );

    const throughCircle = new paper.Path.Circle(through.add(new paper.Point(0, 0)), 10);
    throughCircle.strokeWidth = 2;
    throughCircle.fillColor = new paper.Color('gold');
    throughCircle.opacity = 0;

    const end = new paper.Point(
        center.x + (radius + sectorRadius) * Math.cos(endAngle * (Math.PI / 180)),
        center.y + (radius + sectorRadius) * -Math.sin(endAngle * (Math.PI / 180))
    );

    
    const sector = Object.assign(new paper.Path.Arc(start, through, end), {
        applyMatrix: false,
        fillColor: new paper.Color(0.1, 0.1, 0.1, 1)
    });
    sector.lineTo(center);
    sector.lineTo(start);
    sector.closePath();
    sector.sendToBack();
    //group.addChild(sector)

/*     const sectorText = Object.assign(new paper.PointText(sector.bounds.center), {
        justification: 'center',
        content: sector.id,
        fillColor: 'white',
        fontSize: '18px',
        fontFamily: 'Satoshi',
    }); */

    const playerNumber = Object.assign(new paper.PointText(playerCircle.bounds.center.add(new paper.Point(0, 6))), {
        justification: 'center',
        content: `P${index + 1}`,
        fillColor: offense ? 'black' : 'white',
        fontSize: '18px',
        fontFamily: 'Satoshi',
        fontWeight: 600
    });
    playerNumber.applyMatrix = false;
    const playerCircleGroup = new paper.Group([playerCircle, playerNumber])
    group.addChild(playerCircleGroup)

    const startHinter = new paper.Point(
        center.x + (radius + sectorRadius + 20) * Math.cos(80 * (Math.PI / 180)),
        center.y + (radius + sectorRadius + 20) * -Math.sin(80 * (Math.PI / 180))
    );

    const throughHinter = new paper.Point(
        center.x + (radius + sectorRadius + 25) * Math.cos(90 * (Math.PI / 180)),
        center.y + (radius + sectorRadius + 25) * -Math.sin(90 * (Math.PI / 180))
    );

    const endHinter = new paper.Point(
        center.x + (radius + sectorRadius + 20) * Math.cos(100 * (Math.PI / 180)),
        center.y + (radius + sectorRadius + 20) * -Math.sin(100 * (Math.PI / 180))
    );

    const hinterArc = new paper.Path.Arc(startHinter, throughHinter, endHinter);
    hinterArc.strokeColor = new paper.Color('gold');
    hinterArc.strokeWidth = 4;
    hinterArc.opacity = 0;

    const arrowheadStart = new paper.Path({
        strokeColor: new paper.Color('gold'),
        fillColor: new paper.Color('gold'),
        opacity: 0
    });
    
    // Set the arrowhead shape
    arrowheadStart.add(new paper.Point(0, 0));
    arrowheadStart.add(new paper.Point(10, 5));
    arrowheadStart.add(new paper.Point(10, -5));
    arrowheadStart.closed = true;
    arrowheadStart.position = endHinter;
    arrowheadStart.rotate(hinterArc.getTangentAt(0).angle);

    const arrowheadEnd = new paper.Path({
        strokeColor: new paper.Color('gold'),
        fillColor: new paper.Color('gold'),
        opacity: 0
    });
    
    // Set the arrowhead shape
    arrowheadEnd.add(new paper.Point(0, 0));
    arrowheadEnd.add(new paper.Point(10, 5));
    arrowheadEnd.add(new paper.Point(10, -5));
    arrowheadEnd.closed = true;
    arrowheadEnd.position = startHinter;
    arrowheadEnd.rotate(hinterArc.getTangentAt(hinterArc.length).angle + 50);

    group.addChildren([hinterArc, arrowheadStart, arrowheadEnd])
    group.addChild(throughCircle)

    playerCircleGroup.onMouseEnter = function () {
        if (areHandlersDisabled()) return;

        if (group.id === group.parent.lastChild.id) {
            console.log('already at front');
        } else {
            group.bringToFront();
        }


        if (document.querySelector('.sandbox-wrap.move')) return;

        playerCircle.tween({
            scaling: 1.1
        },{
            easing: 'easeOutCubic',
            duration: 200
        })

        document.body.style.cursor = 'grab';
    }
    playerCircleGroup.onMouseLeave = function () {
        playerCircle.tween({
            scaling: 1
        },{
            easing: 'easeOutCubic',
            duration: 200
        })

        document.body.style.cursor = 'default';
    }

    const savedPlayerCirclePosition = {
        x: playerCircle.position.x,
        y: playerCircle.position.y
    }
    const savedThroughCirclePosition = {
        x: throughCircle.position.x,
        y: throughCircle.position.y
    }
    
    sectorArray.push(sector);


    const checkSectorIntersections = (currentAuthorId: number) => {
        for(const authorIdKey in sectorIntersectionAreas) {
            const authorId = parseInt(authorIdKey);
            if (authorId === currentAuthorId) {
                // If the author of the intersection is the current author
                if (sectorIntersectionAreas[authorIdKey]) {
                    Object.values(sectorIntersectionAreas[authorIdKey]).forEach(area => {
                        if (area) area.remove();
                    })
                }
                continue;
            }

            // If the intersection intersects the current author
            const sectorIntersectsCurrent = sectorIntersectionAreas[authorIdKey]?.[currentAuthorId];
            if (sectorIntersectsCurrent) {
                sectorIntersectsCurrent.remove();
                delete sectorIntersectionAreas[authorIdKey][currentAuthorId];
                if (Object.keys(sectorIntersectionAreas[authorIdKey]).length === 0) {
                    delete sectorIntersectionAreas[authorIdKey];
                }
            }
        }

        clearVar(['intersection-tL', 'intersection-tR', 'intersection-bR', 'intersection-bL'])
        
        const nonIntersectedSavedSectors: paper.Path.Arc[] = [];
        let atLeastOneIntersection = false;

        sectorArray.forEach(savedSector => {
            if (sector.id === savedSector.id) return;
            if (sector.layer.id !== savedSector.layer.id) return;

            const existingArea = sectorIntersectionAreas[sector.id]?.[savedSector.id];
            if (existingArea) {
                existingArea.remove();
                delete sectorIntersectionAreas[sector.id][savedSector.id];
            }

            if (sector.intersects(savedSector)) {
                atLeastOneIntersection = true;
                const area = sector.intersect(savedSector);
                area.fillColor = new paper.Color('#EECD2Cad');
                
                //console.log(`tweening ${sector.id} && ${savedSector.id}`)
                sector.tween({
                    fillColor: new paper.Color('#474747')
                }, {
                    duration: 300,
                    easing: 'easeOutCubic'
                })
                savedSector.tween({
                    fillColor: new paper.Color('#474747')
                }, {
                    duration: 300,
                    easing: 'easeOutCubic'
                })
                

                writeVar('intersection-tL', area.bounds.topLeft)
                writeVar('intersection-tR', area.bounds.topRight)
                writeVar('intersection-bR', area.bounds.bottomRight)
                writeVar('intersection-bL', area.bounds.bottomLeft)

                const existingDict = sectorIntersectionAreas[sector.id];
                sectorIntersectionAreas[sector.id] = {
                    ...existingDict,
                    [savedSector.id]: area
                }
    
            } else {
                nonIntersectedSavedSectors.push(savedSector)
            }
        });

        nonIntersectedSavedSectors.forEach(savedSector => {
            

            const isIntersectedElsewhere = Object.values(sectorIntersectionAreas).some(area => {
                return area[savedSector.id] ? true : false
            })

            if (isIntersectedElsewhere || sectorIntersectionAreas[savedSector.id]) {
                //console.log(savedSector.id, ' is being intersected but not by the author.')
            } else {
                //console.log(savedSector.id, ' is not being intersected by anyone.')
                savedSector.tween({
                    fillColor: new paper.Color(0.1, 0.1, 0.1, 1)
                }, {
                    duration: 300,
                    easing: 'easeOutCubic'
                })
            }
        })

        if (!atLeastOneIntersection) {
            delete sectorIntersectionAreas[sector.id];
            //console.log(`tweening ${sector.id} (author) back to normal`)
            sector.tween({
                fillColor: new paper.Color(0.1, 0.1, 0.1, 1)
            }, {
                duration: 300,
                easing: 'easeOutCubic'
            })
        }
    }

    const playerCircleMouseMoveHandler = (e: any) => {

        const zoom = getZoom();
        const event: MouseEvent = e;

        const deltaX = (event.movementX * (1 / zoom));
        const deltaY =(event.movementY * (1 / zoom));

        group.position.x += deltaX;
        group.position.y += deltaY;

        sector.position.x += deltaX;
        sector.position.y += deltaY;

        savedPlayerCirclePosition.x += deltaX;
        savedPlayerCirclePosition.y += deltaY;

        savedThroughCirclePosition.x += deltaX;
        savedThroughCirclePosition.y += deltaY;

        writeVar('circle-x', savedPlayerCirclePosition.x);
        writeVar('circle-y', savedPlayerCirclePosition.y);

        checkSectorIntersections(sector.id);
    }

    playerCircleGroup.onMouseDown = () => {
        if (areHandlersDisabled()) return;
        disableHandlers();
        document.body.style.cursor = 'grabbing';

        document.addEventListener('mousemove', playerCircleMouseMoveHandler)

        playerCircle.tween({
            scaling: 0.9
        },{
            easing: 'easeOutCubic',
            duration: 200
        })

        playerCircleGroup.onMouseUp = () => {
            enableHandlers();

            playerCircle.tween({
                scaling: 1.1
            },{
                easing: 'easeOutCubic',
                duration: 200
            })

            document.removeEventListener('mousemove', playerCircleMouseMoveHandler)
            document.body.style.cursor = 'grab';

            clearVar('circle-y');
            clearVar('circle-x');
        }
    }

    const throughCircleDocumentMouseMoveHandler = (e: any) => {
        disableHandlers();
        const deltaX = (e.movementX * (1 / getZoom()));
        const deltaY =(e.movementY * (1 / getZoom()));

        savedThroughCirclePosition.x += deltaX;
        savedThroughCirclePosition.y += deltaY;

        checkSectorIntersections(sector.id);

        const pivotOrigin = savedPlayerCirclePosition;
        
        const x = savedThroughCirclePosition.x - pivotOrigin.x;
        const y = savedThroughCirclePosition.y - pivotOrigin.y;

        const targetAngleInRadians = Math.atan2(y, x);
        const targetAngleInDegrees = targetAngleInRadians * (180 / (Math.PI));

        const currentAngle = group.rotation;
        const actualTargetAngleInDegrees = targetAngleInDegrees + 90;

        const moveByAngle = (actualTargetAngleInDegrees - currentAngle);

        group.rotate(moveByAngle, pivotOrigin);
        sector.rotate(moveByAngle, pivotOrigin);
        playerNumber.rotate(-moveByAngle);// Weird

        writeVar('currentAngle', currentAngle.toFixed(2));
        writeVar('targetAngleInDegrees', actualTargetAngleInDegrees.toFixed(2));
        writeVar('moveByAngle', moveByAngle.toFixed(2));

        document.body.style.cursor = 'grabbing';
    }

    let hasMouseLeft = false;
    let isMouseDown = false;

    const throughCircleDocumentMouseUpHandler = () => {
        enableHandlers();
        if (hasMouseLeft) {
            document.body.style.cursor = 'default';

            throughCircle.tween({
                opacity: 0
            }, {
                duration: 300,
                easing: 'easeOutCubic'
            })

            hinterArc.tween({ opacity: 0 },{
                easing: 'easeOutCubic',
                duration: 400
            })
            arrowheadStart.tween({ opacity: 0 },{
                easing: 'easeOutCubic',
                duration: 400
            })
            arrowheadEnd.tween({ opacity: 0 },{
                easing: 'easeOutCubic',
                duration: 400
            })
        } else {
            document.body.style.cursor = 'grab';
        }
        isMouseDown = false;

        clearVar('currentAngle');
        clearVar('targetAngleInDegrees');
        clearVar('moveByAngle');

        document.removeEventListener('mousemove', throughCircleDocumentMouseMoveHandler)
        document.removeEventListener('mouseup', throughCircleDocumentMouseUpHandler)
    }

    throughCircle.onMouseLeave = () => {
        hasMouseLeft = true;
        document.body.style.cursor = 'default';

        if (!isMouseDown) {
            console.log('tweening back')
            hinterArc.tween({ opacity: 0 },{
                easing: 'easeOutCubic',
                duration: 400
            })
            arrowheadStart.tween({ opacity: 0 },{
                easing: 'easeOutCubic',
                duration: 400
            })
            arrowheadEnd.tween({ opacity: 0 },{
                easing: 'easeOutCubic',
                duration: 400
            })
        }
    }

    throughCircle.onMouseEnter = () => {
        if (areHandlersDisabled()) return;
        hasMouseLeft = false;
        document.body.style.cursor = 'grab';
        throughCircle.tween({
            opacity: 1
        }, {
            duration: 300,
            easing: 'easeOutCubic'
        })

        hinterArc.strokeColor = new paper.Color('gold');

        hinterArc.tween({ opacity: 1 },{
            easing: 'easeOutCubic',
            duration: 400
        })
        arrowheadStart.tween({ opacity: 1 },{
            easing: 'easeOutCubic',
            duration: 400
        })
        arrowheadEnd.tween({ opacity: 1 },{
            easing: 'easeOutCubic',
            duration: 400
        })
    }

    throughCircle.onMouseDown = () => {
        if (areHandlersDisabled()) return;
        isMouseDown = true;
        document.body.style.cursor = 'grabbing';


        document.addEventListener('mousemove', throughCircleDocumentMouseMoveHandler)
        document.addEventListener('mouseup', throughCircleDocumentMouseUpHandler)
    }

    sector.onMouseEnter = () => {
        throughCircle.tween({
            opacity: 1
        }, {
            duration: 300,
            easing: 'easeOutCubic'
        })
    }
    sector.onMouseLeave = (e: any) => {
        const point = e.point as paper.Point;
        console.log({point})

        if (isMouseDown == false) {
            throughCircle.tween({
                opacity: 0
            }, {
                duration: 300,
                easing: 'easeOutCubic'
            })
        }
    }

    const positionalsButton = document.querySelector('.get-positionals-button') as HTMLButtonElement;
    positionalsButton.addEventListener('click', () => {
        console.log(`group: ${group.id}`, {
            group: {
                x: group.position.x,
                y: group.position.y
            },
            sector: {
                x: sector.position.x,
                y: sector.position.y
            },
            savedCirclePosition: savedPlayerCirclePosition,
            savedThroughCirclePosition
        })
    })

    checkSectorIntersections(sector.id);

    return {
        group,
        savedPlayerCirclePosition,
        savedThroughCirclePosition
    }
}


const disableHandlers = $(() => {
    document.body.classList.add('disable-handlers');
})
const enableHandlers = $(() => {
    document.body.classList.remove('disable-handlers');
})

const getRandomInteger = ((min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
})

export default component$(() => {
    interface DrawPlayerProps {
        point: paper.Point,
        radius: number,
        sectorAngle: number,
        offense: boolean,
        index: number
    }

    type PlayerGroupStore = { [index: number]: NoSerialize<paper.Group> }

    const currentPlayerStore = useStore({
        playerGroups: {} as PlayerGroupStore
    })

    const drawPlayer = $((props: DrawPlayerProps) => {
        const { point, radius, sectorAngle, offense, index } = props;
    
        // Create the circle
        const circle = new paper.Path.Circle(point, radius);
        circle.applyMatrix = false; // Enables animations
    
        if (offense) { // if the player is offense
            circle.fillColor = new paper.Color(255 / 255, 255 / 255, 255 / 255, 1);
        } else {
            circle.fillColor = new paper.Color('#1d1d1d');
        }
        
        // Create Player Group
        const playerGroup = new paper.Group([circle]);
        playerGroup.applyMatrix = false; 
    
        // Define sector options
        const sectorRadius = 90;

        currentPlayerStore.playerGroups[index] = noSerialize(playerGroup);
    
        return drawSectorFieldOnCircle({
            circle,
            sectorRadius,
            sectorAngle,
            group: playerGroup,
            offense,
            index
        })
    })

    const offenseSectorAngle = useSignal(90);
    const defenseSectorAngle = useSignal(60);

    const zoom = useSignal(1);
    const playerCount = useSignal(0);

    const addOffensePlayer = $(async () => {
        const canvas = document.querySelector('#canvas') as HTMLCanvasElement;

        const randomPoint = new paper.Point(getRandomInteger(50, canvas.width - 50), getRandomInteger(250, canvas.height - 50));

        drawPlayer({
            point: randomPoint,
            radius: 30,
            sectorAngle: offenseSectorAngle.value,
            offense: true,
            index: playerCount.value
        })
        playerCount.value++;

        //console.log(paper.project.activeLayer.children)
    })
    const addDefensePlayer = $(async () => {
        const canvas = document.querySelector('#canvas') as HTMLCanvasElement;

        const randomPoint = new paper.Point(getRandomInteger(50, canvas.width - 50), getRandomInteger(250, canvas.height - 50));
        
        drawPlayer({
            point: randomPoint,
            radius: 30,
            sectorAngle: offenseSectorAngle.value,
            offense: false,
            index: playerCount.value
        })
        playerCount.value++;
    })

    const organizePlayersHandler = $(() => {
        currentPlayerStore
    })

    const clearPlayersHandler = $(() => {
        paper.project.activeLayer.remove();

        const freshLayer = new paper.Layer()
        paper.project.addLayer(freshLayer);
        freshLayer.activate();

        playerCount.value = 0;
    })

    useVisibleTask$(() => {
        const offenseValue = offenseSectorAngle.value;
        const defenseValue = defenseSectorAngle.value;
        document.body.style.overflow = 'hidden';

        try {
            const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
            if (canvas) {
                paper.setup(canvas);
                paper.view.zoom = zoom.value;
                paper.view.onResize = () => {
                    canvas.width = document.body.offsetWidth;
                    canvas.height = (document.body.clientHeight - 1);
                }

                drawPlayer({
                    point: new paper.Point(paper.view.center.x - 100, canvas.height / 2),
                    radius: 30,
                    sectorAngle: offenseValue,
                    offense: true,
                    index: playerCount.value
                })
                playerCount.value++;

                drawPlayer({
                    point: new paper.Point(paper.view.center.x + 100, canvas.height / 2),
                    radius: 30,
                    sectorAngle: defenseValue,
                    offense: false,
                    index: playerCount.value
                })
                playerCount.value++;
            }
        } catch (error) {
            console.error(error)
        } 


        const plainWheelHandler = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.stopPropagation();
                if (paper.view) {
                    if (e.deltaY < 0) {
                        if (zoom.value > 2) return;
                        zoom.value += 0.1;
                    } else {
                        if (zoom.value < 0.5) return;
                        zoom.value -= 0.1;
                    }
                }
            } else {
                if (paper.view) {
                    const deltaX = e.shiftKey ? -e.deltaY : 0;
                    const deltaY = e.shiftKey ? 0 : -e.deltaY;
                    
                    const deltaPoint = new paper.Point(deltaX / zoom.value, deltaY / zoom.value)
                    paper.view.translate(deltaPoint)
                } 
            }
            
        }

        const panMoveGrabHandler = (e: MouseEvent) => {
            if (paper.view) {
                const deltaPoint = new paper.Point(e.movementX / zoom.value, e.movementY  / zoom.value)
                paper.view.translate(deltaPoint)
            }
        }

        let isReadyToGrab = false;
        let isGrabbing = false;

        const resetPanHandlers = () => {
            document.body.style.cursor = 'default'
            document.removeEventListener('mouseup', panMouseUpHandler)
            document.removeEventListener('mousedown', panMouseDownHandler)
            document.removeEventListener('mousemove', panMoveGrabHandler)
            isReadyToGrab = false;
            isGrabbing = false;
            enableHandlers(); 
        }

        const panMouseUpHandler = () => {
            resetPanHandlers();
        }

        const panMouseDownHandler = () => {
            isGrabbing = true;
            document.addEventListener('mousemove', panMoveGrabHandler)
            document.addEventListener('mouseup', panMouseUpHandler)
        }


        const globalKeyDownHandler = (e: KeyboardEvent) => {
            if (e.code == 'Space') {
                e.preventDefault();
                e.stopPropagation();

                if (isGrabbing) {
                    document.body.style.cursor = 'grabbing';
                } else {
                    document.body.style.cursor = 'grab'
                }

                if (isReadyToGrab) return;
                disableHandlers(); 
                document.addEventListener('mousedown', panMouseDownHandler)

                isReadyToGrab = true;
            }
        } 

        const globalKeyUpHandler = (e: KeyboardEvent) => {
            if (e.code == 'Space') {
                e.preventDefault();
                e.stopPropagation();
                
                resetPanHandlers();
            }
        } 

        document.addEventListener('keyup', globalKeyUpHandler);
        document.addEventListener('keydown', globalKeyDownHandler);
        document.addEventListener('wheel', plainWheelHandler);

        //@ts-ignore
        window.sectorIntersectionAreas = sectorIntersectionAreas;
    })

    useTask$(({ track }) => {
        track(() => zoom.value);
        const value = zoom.value;

        try {
            const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
            if (canvas) {
                paper.view.zoom = value;
            }
        } catch (error) {
            //console.error(error);
        }
    })

    const currentMouseTool = useSignal('select');

    const moveToolMouseDownHandler = $((e: any) => {
        const toolsParent = document.querySelector('.sandbox-toolbar-outer') as HTMLElement;
        const isTool = (toolsParent.contains(e.target))
        if (isTool) return;

        const mouseUpHandler = () => {
            document.removeEventListener('mousemove', mouseMoveHandler);
        }
        const mouseMoveHandler = (e: MouseEvent) => {
            if (document.querySelector('.sandbox-wrap.move')) {

                if (paper.view) {
                    const deltaPoint = new paper.Point(e.movementX / zoom.value, e.movementY  / zoom.value)
                    paper.view.translate(deltaPoint)
                }
            }
            document.addEventListener('mouseup', mouseUpHandler)
        }

        if (document.querySelector('.sandbox-wrap.move')) {
            document.addEventListener('mousemove', mouseMoveHandler);
        }
    })

    const moveToolScrollHandler = $((e: WheelEvent) => {
        if (document.querySelector('.sandbox-wrap.move')) {
            console.log({e});

            if (paper.view) {
                const deltaX = e.shiftKey ? -e.deltaY : 0;
                const deltaY = e.shiftKey ? 0 : -e.deltaY;
                
                const deltaPoint = new paper.Point(deltaX / zoom.value, deltaY / zoom.value)
                paper.view.translate(deltaPoint)
            }
        }
    })

    const MoveToolHandlers = $((action: 'assign' | 'remove') => {
        if (action === 'assign') {
            document.addEventListener('wheel', moveToolScrollHandler);
            document.addEventListener('mousedown', moveToolMouseDownHandler);
        } else if (action === 'remove') {
            document.removeEventListener('wheel', moveToolScrollHandler);
            document.removeEventListener('mousedown', moveToolMouseDownHandler);
        }
    })

    return (
        <>
        <script src="https://cdn.jsdelivr.net/npm/paper/dist/paper-full.min.js"></script>

        <div class={`sandbox-wrap ${currentMouseTool.value}`}>
            {//@ts-ignore
            <canvas id="canvas" resize></canvas>
            }
            <div class="write-box"></div>
            <div class="sandbox-toolbar-outer">
                <div class="sandbox-toolbar-inner">
                    <div class="mouse-tools">
                        <div onClick$={() => {
                            currentMouseTool.value = 'select';
                            document.removeEventListener('mousedown', moveToolMouseDownHandler);
                            MoveToolHandlers('remove')
                            enableHandlers();
                        }} class={`select mouse-tool ${currentMouseTool.value === 'select' ? 'active' : ''}`}>
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path><path d="M13 13l6 6"></path></svg>
                        </div>
                        <div onClick$={() => {
                            currentMouseTool.value = 'move';
                            MoveToolHandlers('assign')
                            disableHandlers();
                        }} class={`move mouse-tool ${currentMouseTool.value === 'move' ? 'active' : ''}`}>
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="15 19 12 22 9 19"></polyline><polyline points="19 9 22 12 19 15"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>
                        </div>
                    </div>
                    <div class="content-control-wrap">
                        <button class="add-offense-player" onClick$={addOffensePlayer} >Add Offense</button>
                        <button class="add-offense-player" onClick$={addDefensePlayer} >Add Defense</button>
                        <button class="organize-players" onClick$={organizePlayersHandler} >Organize</button>
                        <button class="clear-players" onClick$={clearPlayersHandler} >Clear</button>
                    </div>
                    <div class="positional-control-wrap">
                        <button class="get-positionals-button">Get positionals</button>
                    </div>
                </div>
            </div>

            <div class="view-actions-wrap">
                <div class="view-actions">
                    <div onClick$={() => {
                        if (zoom.value > 2) return;
                        zoom.value += 0.1;
                    }} class={`zoom-in view-action`}>
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                    </div>
                    <div onClick$={() => {
                        if (zoom.value < 0.5) return;
                        zoom.value -= 0.1;
                    }} class={`zoom-out view-action`}>
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                    </div>
                </div>
            </div>
        </div>

        </>
    )
})

export const head = () => {
    return {
        title: `Front Cone Sandbox Testing`,
        meta: [
            {
                name: 'description',
                content: 'Sandbox testing paper.js',
            },
        ],
    };
}