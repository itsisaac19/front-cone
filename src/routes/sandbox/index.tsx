import { component$, useVisibleTask$ } from "@builder.io/qwik";
import paper from "paper";

interface SectorFieldProps {
    circle: paper.Path.Circle,
    sectorRadius: number,
    group: paper.Group
}
const drawSectorFieldOnCircle = (props: SectorFieldProps) => {
    const { circle, sectorRadius, group } = props;

    const center = circle.bounds.center;
    const radius = circle.bounds.height || circle.bounds.width;

    // Define the angle range of the FOV sector
    // May have to refactor to scale later
    const startAngle = 50;  // Always positive
    const endAngle = 130;   // Always > start angle

    const midpointAngle = (endAngle + startAngle) / 2; // Midpoint / Direction of hips

    console.log({midpointAngle})

    // Calculate the start, through, and end points of the arc
    const start = new paper.Point(
        center.x + (radius + sectorRadius) * Math.cos(startAngle * (Math.PI / 180)),
        center.y + (radius + sectorRadius) * -Math.sin(startAngle * (Math.PI / 180))
    );

    const startCircle = new paper.Path.Circle(start, 15);
    startCircle.strokeWidth = 2;
    //startCircle.strokeColor = new paper.Color(255, 0, 0, 1);

    const through = new paper.Point(
        center.x + (radius + sectorRadius) * Math.cos(midpointAngle * (Math.PI / 180)),
        center.y + (radius + sectorRadius) * -Math.sin(midpointAngle * (Math.PI / 180))
    );
    const throughCircle = new paper.Path.Circle(through, 10);
    throughCircle.strokeWidth = 2;
    //throughCircle.strokeColor = 'gold';

    const end = new paper.Point(
        center.x + (radius + sectorRadius) * Math.cos(endAngle * (Math.PI / 180)),
        center.y + (radius + sectorRadius) * -Math.sin(endAngle * (Math.PI / 180))
    );

    const endCircle = new paper.Path.Circle(end, 15);
    endCircle.strokeWidth = 2;
    //endCircle.strokeColor = new paper.Color(0, 0, 255, 1);
    
    const sector = new paper.Path.Arc(start, through, end);
    sector.lineTo(center)
    sector.lineTo(start)
    sector.fillColor = new paper.Color(24, 24, 24, 0.1);
    console.log(sector.fillColor)
    sector.closePath();

    group.insertChild(0, sector);

    circle.onMouseEnter = function () {
        circle.tween({
            scaling: 1.3
        },{
            easing: 'easeOutCubic',
            duration: 400
        })
        sector.tween({
            fillColor: '#1c1c1c'
        }, {
            fillColor: '#737373'
        },{
            easing: 'easeOutCubic',
            duration: 400
        })

        document.body.style.cursor = "pointer";
    }
    circle.onMouseLeave = function () {
        circle.tween({
            scaling: 1
        },{
            easing: 'easeOutCubic',
            duration: 400
        })

        sector.tween({
            fillColor: '#737373'
        }, {
            fillColor: '#1c1c1c'
        },{
            easing: 'easeOutCubic',
            duration: 400
        })

        document.body.style.cursor = "default";
    }
}

interface DrawPlayerProps {
    point: paper.Point,
    radius: number,
    o: boolean,
    d?: boolean, 
}
const drawPlayer = (props: DrawPlayerProps) => {
    const { point, radius, o } = props;

    // Create the circle
    const circle = new paper.Path.Circle(point, radius);
    circle.applyMatrix = false;
    if (o) {
        circle.fillColor = new paper.Color(255 / 255, 255 / 255, 255 / 255, 1);
    } else {
        circle.fillColor = new paper.Color(65 / 255, 65 / 255, 65 / 255, 1);
    }
    
    // Create Player Group
    const playerGroup = new paper.Group([circle]);



    // Define sector options
    const sectorRadius = 100;

    drawSectorFieldOnCircle({
        circle,
        sectorRadius,
        group: playerGroup
    })
}


export default component$(() => {
    useVisibleTask$(() => {
        const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
        if (canvas) {
            paper.setup(canvas);


            drawPlayer({
                point: new paper.Point(canvas.width / 2, canvas.height / 2),
                radius: 20,
                o: true,
            })
            
        }
    })


    return (
        <div class="sandbox-wrap">
            <canvas id="canvas"></canvas>
        </div>
    )
})