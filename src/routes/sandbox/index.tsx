import { $, component$, type NoSerialize, noSerialize, useSignal, useStore, useTask$, useVisibleTask$ } from '@builder.io/qwik';
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
    if (!offense) throughCircle.strokeColor = new paper.Color('#ededed');
    throughCircle.fillColor = offense ? new paper.Color('#fff') : new paper.Color('#000');
    throughCircle.opacity = 0;

    const end = new paper.Point(
        center.x + (radius + sectorRadius) * Math.cos(endAngle * (Math.PI / 180)),
        center.y + (radius + sectorRadius) * -Math.sin(endAngle * (Math.PI / 180))
    );

    
    const sector = Object.assign(new paper.Path.Arc(start, through, end), {
        applyMatrix: false,
        fillColor: new paper.Color(0, 0, 0, 0),
        strokeWidth: 1,
        strokeColor: new paper.Color('#2d2d2d')
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

        /* enableHandlers();

        document.removeEventListener('mousemove', playerCircleMouseMoveHandler)

        clearVar('circle-y');
        clearVar('circle-x'); */
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
                const areaFillColor = new paper.Color('#EECD2Cad');
                area.fillColor = areaFillColor;

                area.onMouseEnter = () => {
                    throughCircle.tween({
                        opacity: 1
                    }, {
                        duration: 300,
                        easing: 'easeOutCubic'
                    })
                }
                area.onMouseLeave = () => {
                    throughCircle.tween({
                        opacity: 0
                    }, {
                        duration: 300,
                        easing: 'easeOutCubic'
                    })
                }
                
                //console.log(`tweening ${sector.id} && ${savedSector.id}`)
                sector.tween({
                    strokeColor: new paper.Color('#666')
                }, {
                    duration: 300,
                    easing: 'easeOutCubic'
                })
                savedSector.tween({
                    strokeColor: new paper.Color('#666')
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
                    fillColor: new paper.Color(0, 0, 0, 1),
                    strokeColor: new paper.Color('#2d2d2d')
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
                fillColor: new paper.Color(0, 0, 0, 1),
                strokeColor: new paper.Color('#2d2d2d ')
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
            scaling: 1.2
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
        console.log(savedThroughCirclePosition)
    }

    if (!offense) {
        group.rotate(180, savedPlayerCirclePosition);
        sector.rotate(180, savedPlayerCirclePosition);
        playerNumber.rotate(-180);// Weird

        savedThroughCirclePosition.y += 300; // RADIUS IS 300 
        console.log(savedThroughCirclePosition)
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

const removePlayer = $((playerItems: paper.Item[]) => {
    const trashLayer = paper.project.layers.find(layer => layer.name == 'trash');
    trashLayer?.addChildren(playerItems);
}) 

const findLayer = $((layerName: string) => {
    const found = paper.project.layers.find(layer => layer.name === layerName);
    return found;
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

    const zoom = useSignal(0.8);
    const playerCount = useSignal(0);

    const addOffensePlayer = $(async () => {
        const canvas = document.querySelector('#canvas') as HTMLCanvasElement;

        const field = (await findLayer('field'))?.children[0];
        let fieldPoint;
        if (field) {
            fieldPoint = field.bounds.center.add(new paper.Point(67, 400));
        }
        const randomPoint = new paper.Point(getRandomInteger(50, canvas.width - 50), getRandomInteger(250, canvas.height - 50));

        const pData = drawPlayer({
            point: fieldPoint || randomPoint,
            radius: 30,
            sectorAngle: offenseSectorAngle.value,
            offense: true,
            index: playerCount.value
        })
        playerCount.value++;

        return pData;
    })
    const addDefensePlayer = $(async () => {
        const canvas = document.querySelector('#canvas') as HTMLCanvasElement;

        const field = (await findLayer('field'))?.children[0];
        let fieldPoint;
        if (field) {
            fieldPoint = field.bounds.center.add(new paper.Point(67, -400));
        }
        const randomPoint = new paper.Point(getRandomInteger(50, canvas.width - 50), getRandomInteger(250, canvas.height - 50));
        
        const pData = drawPlayer({
            point: fieldPoint || randomPoint,
            radius: 30,
            sectorAngle: defenseSectorAngle.value,
            offense: false,
            index: playerCount.value
        })
        playerCount.value++;

        return pData;
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

    const fieldScale = useSignal(1.5);

    const fieldScaleRangeInputHandler = $(async (e: any) => {
        const lastScale = fieldScale.value;

        const fieldLayer = await findLayer('field');
        const field = fieldLayer?.children[0];

        if (field) {
            field.scale(1 / lastScale);
            field.scale(e.target.value);
        }

        fieldScale.value = e.target.value;
    })

    useVisibleTask$(async () => {
        document.body.style.overflow = 'hidden';

        try {
            const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
            if (canvas) {
                paper.setup(canvas);
                paper.view.zoom = zoom.value;
                paper.view.onResize = (e: any) => {
                    canvas.width = document.body.offsetWidth;
                    canvas.height = (document.body.clientHeight - 1);

                    console.log(e)

                    paper.view.translate(new paper.Point(e.delta.width / 2, 0))
                }

                const trashLayer = new paper.Layer();
                trashLayer.name = 'trash';

                const fieldLayer = new paper.Layer();
                fieldLayer.name = 'field';
                paper.project.addLayer(fieldLayer);
                fieldLayer.activate();
                const field = paper.project.importSVG(`
                <svg width="737" height="1035" viewBox="0 0 737 1035" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="412.046" cy="638.046" r="13.1747" transform="rotate(45 412.046 638.046)" stroke="#666666" stroke-width="2"/>
                <line x1="401.899" y1="628.146" x2="420.991" y2="647.238" stroke="#666666" stroke-width="2"/>
                <line x1="420.991" y1="628.854" x2="401.899" y2="647.945" stroke="#666666" stroke-width="2"/>
                <circle cx="412.046" cy="396.046" r="13.1747" transform="rotate(45 412.046 396.046)" stroke="#666666" stroke-width="2"/>
                <line x1="401.899" y1="386.146" x2="420.991" y2="405.238" stroke="#666666" stroke-width="2"/>
                <line x1="420.991" y1="386.854" x2="401.899" y2="405.945" stroke="#666666" stroke-width="2"/>
                <rect x="736" y="1" width="1033" height="658" transform="rotate(90 736 1)" stroke="#666666" stroke-width="2"/>
                <path d="M9.4 946H2.344V934.432H9.4V935.872H3.192L3.912 935.248V939.488H8.856V940.88H3.912V945.2L3.192 944.544H9.4V946ZM12.9201 946H11.4161V938.176H12.7761L12.9361 939.376C13.1815 938.928 13.5335 938.581 13.9921 938.336C14.4615 938.08 14.9735 937.952 15.5281 937.952C16.5521 937.952 17.3095 938.245 17.8001 938.832C18.2908 939.419 18.5361 940.213 18.5361 941.216V946H17.0321V941.552C17.0321 940.763 16.8615 940.197 16.5201 939.856C16.1788 939.504 15.7201 939.328 15.1441 939.328C14.4401 939.328 13.8908 939.557 13.4961 940.016C13.1121 940.475 12.9201 941.088 12.9201 941.856V946ZM23.7552 946.192C22.9979 946.192 22.3473 946.021 21.8033 945.68C21.2593 945.328 20.8379 944.843 20.5393 944.224C20.2513 943.605 20.1073 942.901 20.1073 942.112C20.1073 941.312 20.2566 940.603 20.5553 939.984C20.8539 939.355 21.2806 938.859 21.8353 938.496C22.3899 938.133 23.0513 937.952 23.8193 937.952C24.4273 937.952 24.9659 938.08 25.4353 938.336C25.9153 938.581 26.2886 938.949 26.5553 939.44V934.224H28.0433V946H26.6993L26.5713 944.576C26.3153 945.099 25.9366 945.499 25.4353 945.776C24.9446 946.053 24.3846 946.192 23.7552 946.192ZM24.0593 944.832C24.5713 944.832 25.0086 944.715 25.3713 944.48C25.7446 944.245 26.0326 943.92 26.2353 943.504C26.4379 943.088 26.5393 942.608 26.5393 942.064C26.5393 941.52 26.4379 941.045 26.2353 940.64C26.0326 940.224 25.7446 939.899 25.3713 939.664C25.0086 939.429 24.5713 939.312 24.0593 939.312C23.5473 939.312 23.1099 939.435 22.7473 939.68C22.3846 939.915 22.1073 940.24 21.9153 940.656C21.7233 941.061 21.6273 941.531 21.6273 942.064C21.6273 942.608 21.7233 943.088 21.9153 943.504C22.1073 943.92 22.3846 944.245 22.7473 944.48C23.1099 944.715 23.5473 944.832 24.0593 944.832ZM35.829 946H29.733V944.784L33.957 939.44H29.733V938.176H35.829V939.408L31.573 944.736H35.829V946ZM36.8416 942.08C36.8416 941.28 37.0176 940.571 37.3696 939.952C37.7216 939.333 38.2016 938.848 38.8096 938.496C39.4283 938.144 40.1323 937.968 40.9216 937.968C41.711 937.968 42.4096 938.144 43.0176 938.496C43.6256 938.848 44.1056 939.333 44.4576 939.952C44.8096 940.571 44.9856 941.28 44.9856 942.08C44.9856 942.88 44.8096 943.589 44.4576 944.208C44.1056 944.827 43.6256 945.312 43.0176 945.664C42.4096 946.016 41.711 946.192 40.9216 946.192C40.1323 946.192 39.4283 946.016 38.8096 945.664C38.2016 945.312 37.7216 944.827 37.3696 944.208C37.0176 943.589 36.8416 942.88 36.8416 942.08ZM38.3616 942.08C38.3616 942.624 38.4683 943.104 38.6816 943.52C38.9056 943.936 39.2096 944.261 39.5936 944.496C39.9776 944.731 40.4203 944.848 40.9216 944.848C41.423 944.848 41.8656 944.731 42.2496 944.496C42.6336 944.261 42.9323 943.936 43.1456 943.52C43.3696 943.104 43.4816 942.624 43.4816 942.08C43.4816 941.525 43.3696 941.045 43.1456 940.64C42.9323 940.224 42.6336 939.899 42.2496 939.664C41.8656 939.429 41.423 939.312 40.9216 939.312C40.4203 939.312 39.9776 939.429 39.5936 939.664C39.2096 939.899 38.9056 940.224 38.6816 940.64C38.4683 941.045 38.3616 941.525 38.3616 942.08ZM48.1545 946H46.6505V938.176H48.0105L48.1705 939.376C48.4158 938.928 48.7678 938.581 49.2265 938.336C49.6958 938.08 50.2078 937.952 50.7625 937.952C51.7865 937.952 52.5438 938.245 53.0345 938.832C53.5252 939.419 53.7705 940.213 53.7705 941.216V946H52.2665V941.552C52.2665 940.763 52.0958 940.197 51.7545 939.856C51.4132 939.504 50.9545 939.328 50.3785 939.328C49.6745 939.328 49.1252 939.557 48.7305 940.016C48.3465 940.475 48.1545 941.088 48.1545 941.856V946ZM59.2296 946.192C58.4723 946.192 57.8003 946.021 57.2136 945.68C56.627 945.328 56.1683 944.848 55.8376 944.24C55.507 943.621 55.3416 942.907 55.3416 942.096C55.3416 941.275 55.5016 940.555 55.8216 939.936C56.1523 939.317 56.6003 938.832 57.1656 938.48C57.7416 938.128 58.4083 937.952 59.1656 937.952C59.9123 937.952 60.5576 938.112 61.1016 938.432C61.6563 938.752 62.083 939.2 62.3816 939.776C62.691 940.352 62.8456 941.029 62.8456 941.808V942.368L56.1416 942.384L56.1736 941.376H61.3416C61.3416 940.725 61.1443 940.203 60.7496 939.808C60.355 939.413 59.827 939.216 59.1656 939.216C58.6643 939.216 58.2323 939.328 57.8696 939.552C57.5176 939.765 57.2456 940.085 57.0536 940.512C56.8723 940.928 56.7816 941.429 56.7816 942.016C56.7816 942.955 56.995 943.68 57.4216 944.192C57.8483 944.693 58.4616 944.944 59.2616 944.944C59.8483 944.944 60.3283 944.827 60.7016 944.592C61.075 944.357 61.3256 944.016 61.4536 943.568H62.8616C62.6696 944.4 62.259 945.045 61.6296 945.504C61.0003 945.963 60.2003 946.192 59.2296 946.192Z" fill="#666666"/>
                <path d="M28.912 632.432V644H27.344V632.432H28.912ZM31.888 638.896H28.48V637.536H31.76C32.4107 637.536 32.912 637.371 33.264 637.04C33.616 636.709 33.792 636.24 33.792 635.632C33.792 635.056 33.6053 634.613 33.232 634.304C32.8693 633.984 32.3467 633.824 31.664 633.824H28.208V632.432H31.76C32.8907 632.432 33.776 632.704 34.416 633.248C35.0667 633.792 35.392 634.539 35.392 635.488C35.392 636.203 35.216 636.8 34.864 637.28C34.5227 637.749 34.016 638.091 33.344 638.304V638.096C34.0907 638.277 34.6507 638.608 35.024 639.088C35.408 639.557 35.6 640.165 35.6 640.912C35.6 641.552 35.4507 642.107 35.152 642.576C34.864 643.035 34.4427 643.387 33.888 643.632C33.3333 643.877 32.6773 644 31.92 644H28.208V642.608H31.888C32.56 642.608 33.0773 642.443 33.44 642.112C33.8027 641.781 33.984 641.317 33.984 640.72C33.984 640.144 33.7973 639.696 33.424 639.376C33.0613 639.056 32.5493 638.896 31.888 638.896ZM41.7868 636.112V637.488H41.1148C40.4001 637.488 39.8348 637.696 39.4188 638.112C39.0134 638.517 38.8108 639.099 38.8108 639.856V644H37.3068V636.192H38.7148L38.8428 637.76H38.6988C38.8054 637.248 39.0614 636.832 39.4668 636.512C39.8721 636.181 40.3788 636.016 40.9868 636.016C41.1254 636.016 41.2534 636.027 41.3708 636.048C41.4988 636.059 41.6374 636.08 41.7868 636.112ZM43.1974 644V636.176H44.7014V644H43.1974ZM43.9334 634.32C43.6667 634.32 43.432 634.224 43.2294 634.032C43.0374 633.829 42.9414 633.595 42.9414 633.328C42.9414 633.051 43.0374 632.816 43.2294 632.624C43.432 632.432 43.6667 632.336 43.9334 632.336C44.2107 632.336 44.4454 632.432 44.6374 632.624C44.8294 632.816 44.9254 633.051 44.9254 633.328C44.9254 633.595 44.8294 633.829 44.6374 634.032C44.4454 634.224 44.2107 634.32 43.9334 634.32ZM46.3729 640.096C46.3729 639.275 46.5329 638.555 46.8529 637.936C47.1835 637.317 47.6369 636.832 48.2129 636.48C48.7889 636.128 49.4555 635.952 50.2129 635.952C51.1942 635.952 52.0102 636.213 52.6609 636.736C53.3115 637.259 53.7009 637.952 53.8289 638.816H52.3249C52.1969 638.315 51.9462 637.936 51.5729 637.68C51.1995 637.424 50.7622 637.296 50.2609 637.296C49.7915 637.296 49.3755 637.413 49.0129 637.648C48.6502 637.872 48.3675 638.192 48.1649 638.608C47.9622 639.024 47.8609 639.515 47.8609 640.08C47.8609 640.645 47.9569 641.136 48.1489 641.552C48.3409 641.957 48.6129 642.277 48.9649 642.512C49.3169 642.736 49.7275 642.848 50.1969 642.848C50.7302 642.848 51.1889 642.715 51.5729 642.448C51.9569 642.181 52.2129 641.819 52.3409 641.36H53.8449C53.7489 641.925 53.5302 642.421 53.1889 642.848C52.8582 643.264 52.4315 643.595 51.9089 643.84C51.3969 644.075 50.8262 644.192 50.1969 644.192C49.4289 644.192 48.7569 644.021 48.1809 643.68C47.6155 643.339 47.1729 642.864 46.8529 642.256C46.5329 641.637 46.3729 640.917 46.3729 640.096ZM56.9678 644H55.4638V632.224H56.9678V639.856L60.4398 636.176H62.3278L59.3358 639.296L62.3118 644H60.5838L58.2958 640.384L56.9678 641.776V644Z" fill="#666666"/>
                <path d="M28.912 390.432V402H27.344V390.432H28.912ZM31.888 396.896H28.48V395.536H31.76C32.4107 395.536 32.912 395.371 33.264 395.04C33.616 394.709 33.792 394.24 33.792 393.632C33.792 393.056 33.6053 392.613 33.232 392.304C32.8693 391.984 32.3467 391.824 31.664 391.824H28.208V390.432H31.76C32.8907 390.432 33.776 390.704 34.416 391.248C35.0667 391.792 35.392 392.539 35.392 393.488C35.392 394.203 35.216 394.8 34.864 395.28C34.5227 395.749 34.016 396.091 33.344 396.304V396.096C34.0907 396.277 34.6507 396.608 35.024 397.088C35.408 397.557 35.6 398.165 35.6 398.912C35.6 399.552 35.4507 400.107 35.152 400.576C34.864 401.035 34.4427 401.387 33.888 401.632C33.3333 401.877 32.6773 402 31.92 402H28.208V400.608H31.888C32.56 400.608 33.0773 400.443 33.44 400.112C33.8027 399.781 33.984 399.317 33.984 398.72C33.984 398.144 33.7973 397.696 33.424 397.376C33.0613 397.056 32.5493 396.896 31.888 396.896ZM41.7868 394.112V395.488H41.1148C40.4001 395.488 39.8348 395.696 39.4188 396.112C39.0134 396.517 38.8108 397.099 38.8108 397.856V402H37.3068V394.192H38.7148L38.8428 395.76H38.6988C38.8054 395.248 39.0614 394.832 39.4668 394.512C39.8721 394.181 40.3788 394.016 40.9868 394.016C41.1254 394.016 41.2534 394.027 41.3708 394.048C41.4988 394.059 41.6374 394.08 41.7868 394.112ZM43.1974 402V394.176H44.7014V402H43.1974ZM43.9334 392.32C43.6667 392.32 43.432 392.224 43.2294 392.032C43.0374 391.829 42.9414 391.595 42.9414 391.328C42.9414 391.051 43.0374 390.816 43.2294 390.624C43.432 390.432 43.6667 390.336 43.9334 390.336C44.2107 390.336 44.4454 390.432 44.6374 390.624C44.8294 390.816 44.9254 391.051 44.9254 391.328C44.9254 391.595 44.8294 391.829 44.6374 392.032C44.4454 392.224 44.2107 392.32 43.9334 392.32ZM46.3729 398.096C46.3729 397.275 46.5329 396.555 46.8529 395.936C47.1835 395.317 47.6369 394.832 48.2129 394.48C48.7889 394.128 49.4555 393.952 50.2129 393.952C51.1942 393.952 52.0102 394.213 52.6609 394.736C53.3115 395.259 53.7009 395.952 53.8289 396.816H52.3249C52.1969 396.315 51.9462 395.936 51.5729 395.68C51.1995 395.424 50.7622 395.296 50.2609 395.296C49.7915 395.296 49.3755 395.413 49.0129 395.648C48.6502 395.872 48.3675 396.192 48.1649 396.608C47.9622 397.024 47.8609 397.515 47.8609 398.08C47.8609 398.645 47.9569 399.136 48.1489 399.552C48.3409 399.957 48.6129 400.277 48.9649 400.512C49.3169 400.736 49.7275 400.848 50.1969 400.848C50.7302 400.848 51.1889 400.715 51.5729 400.448C51.9569 400.181 52.2129 399.819 52.3409 399.36H53.8449C53.7489 399.925 53.5302 400.421 53.1889 400.848C52.8582 401.264 52.4315 401.595 51.9089 401.84C51.3969 402.075 50.8262 402.192 50.1969 402.192C49.4289 402.192 48.7569 402.021 48.1809 401.68C47.6155 401.339 47.1729 400.864 46.8529 400.256C46.5329 399.637 46.3729 398.917 46.3729 398.096ZM56.9678 402H55.4638V390.224H56.9678V397.856L60.4398 394.176H62.3278L59.3358 397.296L62.3118 402H60.5838L58.2958 398.384L56.9678 399.776V402Z" fill="#666666"/>
                <path d="M8.4 102H1.344V90.432H8.4V91.872H2.192L2.912 91.248V95.488H7.856V96.88H2.912V101.2L2.192 100.544H8.4V102ZM11.9201 102H10.4161V94.176H11.7761L11.9361 95.376C12.1815 94.928 12.5335 94.5813 12.9921 94.336C13.4615 94.08 13.9735 93.952 14.5281 93.952C15.5521 93.952 16.3095 94.2453 16.8001 94.832C17.2908 95.4187 17.5361 96.2133 17.5361 97.216V102H16.0321V97.552C16.0321 96.7627 15.8615 96.1973 15.5201 95.856C15.1788 95.504 14.7201 95.328 14.1441 95.328C13.4401 95.328 12.8908 95.5573 12.4961 96.016C12.1121 96.4747 11.9201 97.088 11.9201 97.856V102ZM22.7552 102.192C21.9979 102.192 21.3473 102.021 20.8033 101.68C20.2593 101.328 19.8379 100.843 19.5393 100.224C19.2513 99.6053 19.1073 98.9013 19.1073 98.112C19.1073 97.312 19.2566 96.6027 19.5553 95.984C19.8539 95.3547 20.2806 94.8587 20.8353 94.496C21.3899 94.1333 22.0513 93.952 22.8193 93.952C23.4273 93.952 23.9659 94.08 24.4353 94.336C24.9153 94.5813 25.2886 94.9493 25.5553 95.44V90.224H27.0433V102H25.6993L25.5713 100.576C25.3153 101.099 24.9366 101.499 24.4353 101.776C23.9446 102.053 23.3846 102.192 22.7552 102.192ZM23.0593 100.832C23.5713 100.832 24.0086 100.715 24.3713 100.48C24.7446 100.245 25.0326 99.92 25.2353 99.504C25.4379 99.088 25.5393 98.608 25.5393 98.064C25.5393 97.52 25.4379 97.0453 25.2353 96.64C25.0326 96.224 24.7446 95.8987 24.3713 95.664C24.0086 95.4293 23.5713 95.312 23.0593 95.312C22.5473 95.312 22.1099 95.4347 21.7473 95.68C21.3846 95.9147 21.1073 96.24 20.9153 96.656C20.7233 97.0613 20.6273 97.5307 20.6273 98.064C20.6273 98.608 20.7233 99.088 20.9153 99.504C21.1073 99.92 21.3846 100.245 21.7473 100.48C22.1099 100.715 22.5473 100.832 23.0593 100.832ZM34.829 102H28.733V100.784L32.957 95.44H28.733V94.176H34.829V95.408L30.573 100.736H34.829V102ZM35.8416 98.08C35.8416 97.28 36.0176 96.5707 36.3696 95.952C36.7216 95.3333 37.2016 94.848 37.8096 94.496C38.4283 94.144 39.1323 93.968 39.9216 93.968C40.711 93.968 41.4096 94.144 42.0176 94.496C42.6256 94.848 43.1056 95.3333 43.4576 95.952C43.8096 96.5707 43.9856 97.28 43.9856 98.08C43.9856 98.88 43.8096 99.5893 43.4576 100.208C43.1056 100.827 42.6256 101.312 42.0176 101.664C41.4096 102.016 40.711 102.192 39.9216 102.192C39.1323 102.192 38.4283 102.016 37.8096 101.664C37.2016 101.312 36.7216 100.827 36.3696 100.208C36.0176 99.5893 35.8416 98.88 35.8416 98.08ZM37.3616 98.08C37.3616 98.624 37.4683 99.104 37.6816 99.52C37.9056 99.936 38.2096 100.261 38.5936 100.496C38.9776 100.731 39.4203 100.848 39.9216 100.848C40.423 100.848 40.8656 100.731 41.2496 100.496C41.6336 100.261 41.9323 99.936 42.1456 99.52C42.3696 99.104 42.4816 98.624 42.4816 98.08C42.4816 97.5253 42.3696 97.0453 42.1456 96.64C41.9323 96.224 41.6336 95.8987 41.2496 95.664C40.8656 95.4293 40.423 95.312 39.9216 95.312C39.4203 95.312 38.9776 95.4293 38.5936 95.664C38.2096 95.8987 37.9056 96.224 37.6816 96.64C37.4683 97.0453 37.3616 97.5253 37.3616 98.08ZM47.1545 102H45.6505V94.176H47.0105L47.1705 95.376C47.4158 94.928 47.7678 94.5813 48.2265 94.336C48.6958 94.08 49.2078 93.952 49.7625 93.952C50.7865 93.952 51.5438 94.2453 52.0345 94.832C52.5252 95.4187 52.7705 96.2133 52.7705 97.216V102H51.2665V97.552C51.2665 96.7627 51.0958 96.1973 50.7545 95.856C50.4132 95.504 49.9545 95.328 49.3785 95.328C48.6745 95.328 48.1252 95.5573 47.7305 96.016C47.3465 96.4747 47.1545 97.088 47.1545 97.856V102ZM58.2296 102.192C57.4723 102.192 56.8003 102.021 56.2136 101.68C55.627 101.328 55.1683 100.848 54.8376 100.24C54.507 99.6213 54.3416 98.9067 54.3416 98.096C54.3416 97.2747 54.5016 96.5547 54.8216 95.936C55.1523 95.3173 55.6003 94.832 56.1656 94.48C56.7416 94.128 57.4083 93.952 58.1656 93.952C58.9123 93.952 59.5576 94.112 60.1016 94.432C60.6563 94.752 61.083 95.2 61.3816 95.776C61.691 96.352 61.8456 97.0293 61.8456 97.808V98.368L55.1416 98.384L55.1736 97.376H60.3416C60.3416 96.7253 60.1443 96.2027 59.7496 95.808C59.355 95.4133 58.827 95.216 58.1656 95.216C57.6643 95.216 57.2323 95.328 56.8696 95.552C56.5176 95.7653 56.2456 96.0853 56.0536 96.512C55.8723 96.928 55.7816 97.4293 55.7816 98.016C55.7816 98.9547 55.995 99.68 56.4216 100.192C56.8483 100.693 57.4616 100.944 58.2616 100.944C58.8483 100.944 59.3283 100.827 59.7016 100.592C60.075 100.357 60.3256 100.016 60.4536 99.568H61.8616C61.6696 100.4 61.259 101.045 60.6296 101.504C60.0003 101.963 59.2003 102.192 58.2296 102.192Z" fill="#666666"/>
                <line x1="79" y1="188" x2="735" y2="188" stroke="#666666" stroke-width="2"/>
                <line x1="79" y1="845" x2="735" y2="845" stroke="#666666" stroke-width="2"/>
                </svg>
                                                            
                `)

                field.position = paper.view.center.add(new paper.Point(-78, 0));
                field.scale(fieldScale.value);

                const everythingElseLayer = new paper.Layer()
                paper.project.addLayer(everythingElseLayer);
                everythingElseLayer.activate();

                await addOffensePlayer()
                addDefensePlayer()
            }
        } catch (error) {
            console.error(error)
        } 


        const plainWheelHandler = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
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
        document.addEventListener('wheel', plainWheelHandler, {
            passive: false
        });

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
            <canvas id="canvas" data-paper-resize="true" data-paper-hidpi="off"></canvas>
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
                    <div class="view-action field-scale">
                        <span class="field-scale-label">Field scale: {fieldScale.value}</span>
                        <input onInput$={fieldScaleRangeInputHandler} type="range" min={0.5} max={3} step={0.05} value={fieldScale.value} name="" id="" />
                    </div>
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