import java.awt.*;
import javax.swing.*;

public class MyApp {

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            JFrame frame = new JFrame("My App");
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setLayout(new FlowLayout(FlowLayout.CENTER, 12, 12));

            JButton button1 = new JButton("Click Me");
            frame.add(button1);

            JLabel label1 = new JLabel("Waiting for a click");
            frame.add(label1);

            button1.addActionListener(event -> {
                label1.setText("You clicked the button!");
            });

            frame.setSize(260, 300); // includes the title bar
            frame.setVisible(true);
        });
    }
}