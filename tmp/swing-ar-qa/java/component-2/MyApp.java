import java.awt.*;
import javax.swing.*;

public class MyApp {

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            JFrame frame = new JFrame("My App");
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setLayout(new FlowLayout(FlowLayout.CENTER, 12, 12));

            JPanel panel1 = new JPanel(new FlowLayout(FlowLayout.CENTER, 12, 12));
            JButton button1 = new JButton("Inside the box");
            panel1.add(button1);
            // Place the component in the frame to connect it.

            frame.setSize(400, 300); // includes the title bar
            frame.setVisible(true);
        });
    }
}